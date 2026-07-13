import { test } from "node:test";
import assert from "node:assert/strict";
import {
  timecode,
  buildEdl,
  buildFcpxml,
  buildOtio,
  buildShotListCsv,
} from "../src/lib/export/formats.ts";

const meta = { title: "Test", fps: 24, width: 1920, height: 1080 };
const clips = [
  { sceneIndex: 0, shotIndex: 0, name: "S1.1", durationSec: 5, url: "https://cdn/a.mp4" },
  { sceneIndex: 0, shotIndex: 1, name: "S1.2", durationSec: 3, url: null },
];

test("timecode is SMPTE at fps", () => {
  assert.equal(timecode(0, 24), "00:00:00:00");
  assert.equal(timecode(5, 24), "00:00:05:00");
  assert.equal(timecode(61.5, 24), "00:01:01:12");
});

test("EDL record timecodes accumulate", () => {
  const edl = buildEdl(clips, meta);
  assert.match(edl, /TITLE: Test/);
  // clip 1: rec 0->5s, clip 2: rec 5->8s
  assert.match(edl, /00:00:00:00 00:00:05:00 00:00:00:00 00:00:05:00/);
  assert.match(edl, /00:00:00:00 00:00:03:00 00:00:05:00 00:00:08:00/);
});

test("FCPXML uses asset-clip for media and gap for missing", () => {
  const fx = buildFcpxml(clips, meta);
  assert.match(fx, /<spine>/);
  assert.match(fx, /asset-clip ref="a0"/);
  assert.match(fx, /<gap /); // second clip has no url
});

test("OTIO is valid JSON with external/missing references", () => {
  const otio = JSON.parse(buildOtio(clips, meta));
  const track = otio.tracks.children[0].children;
  assert.equal(track.length, 2);
  assert.equal(track[0].media_reference.OTIO_SCHEMA, "ExternalReference.1");
  assert.equal(track[1].media_reference.OTIO_SCHEMA, "MissingReference.1");
});

test("CSV escapes commas and quotes", () => {
  const csv = buildShotListCsv([
    { scene: 1, shot: 1, size: "CU", angle: "low", lensMm: 85, movement: "pan, tilt", durationSec: 5, status: "rendered", takes: 2, creditCost: 48 },
  ]);
  assert.match(csv, /"pan, tilt"/);
  assert.match(csv.split("\n")[0], /^Scene,Shot,Size/);
});
