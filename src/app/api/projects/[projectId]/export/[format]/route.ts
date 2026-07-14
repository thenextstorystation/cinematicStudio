import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { getSequence, getShotList, getProjectExport } from "@/server/edit";
import {
  buildEdl,
  buildFcpxml,
  buildOtio,
  buildShotListCsv,
  type SequenceMeta,
} from "@/lib/export/formats";

/**
 * Download an edit/handoff artifact for a project (PRD §12.5 / §17.1).
 * format ∈ edl | fcpxml | otio | csv | json
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; format: string }> },
) {
  const { projectId, format } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aspectToDims: Record<string, [number, number]> = {
    "16:9": [1920, 1080],
    "9:16": [1080, 1920],
    "1:1": [1080, 1080],
    "21:9": [2560, 1080],
  };

  try {
    let body: string;
    let contentType: string;
    let filename: string;

    if (format === "csv") {
      const rows = await getShotList(user.id, projectId);
      body = buildShotListCsv(rows);
      contentType = "text/csv";
      filename = "shot-list.csv";
    } else if (format === "json") {
      const data = await getProjectExport(user.id, projectId);
      body = JSON.stringify(data, null, 2);
      contentType = "application/json";
      filename = "project.json";
    } else {
      const { clips, title, aspectRatio } = await getSequence(user.id, projectId);
      const [width, height] = aspectToDims[aspectRatio] ?? [1920, 1080];
      const meta: SequenceMeta = { title, fps: 24, width, height };

      if (format === "edl") {
        body = buildEdl(clips, meta);
        contentType = "text/plain";
        filename = "timeline.edl";
      } else if (format === "fcpxml") {
        body = buildFcpxml(clips, meta);
        contentType = "application/xml";
        filename = "timeline.fcpxml";
      } else if (format === "otio") {
        body = buildOtio(clips, meta);
        contentType = "application/json";
        filename = "timeline.otio";
      } else {
        return NextResponse.json(
          { error: `Unknown export format: ${format}` },
          { status: 400 },
        );
      }
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed";
    const status = message === "Project not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
