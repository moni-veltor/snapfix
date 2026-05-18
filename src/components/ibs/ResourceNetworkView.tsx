"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Resource, SharedPeer } from "./ResourceMapEditor";

const KIND_COLOR: Record<Resource["kind"], string> = {
  TECHNOLOGY: "#06b6d4",
  THIRD_PARTY: "#10b981",
  INFORMATION: "#8b5cf6",
  PROCESS: "#4f46e5",
  PEOPLE: "#e11d48",
  FACILITY: "#d97706",
};

const CRIT_BORDER: Record<Resource["criticality"], string> = {
  CRITICAL: "#dc2626",
  IMPORTANT: "#d97706",
  SUPPORTING: "#94a3b8",
};

type Props = {
  ibsCode: string;
  ibsName: string;
  resources: Resource[];
  sharedBy: Record<string, SharedPeer[]>;
};

/**
 * Graph view of the resource map. IBS at the centre, dependencies in
 * concentric rings around it (Critical = innermost), peer IBSs (those
 * sharing one of our dependencies) on the outer ring with dashed edges.
 *
 * Pan / zoom / minimap built in via react-flow. Hover an edge to see the
 * shared dependency in the tooltip.
 */
export default function ResourceNetworkView({
  ibsCode,
  ibsName,
  resources,
  sharedBy,
}: Props) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Central IBS node
    nodes.push({
      id: "ibs-self",
      data: { label: `${ibsCode}\n${ibsName}` },
      position: { x: 0, y: 0 },
      style: {
        background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
        color: "white",
        border: "2px solid #4338ca",
        borderRadius: 12,
        padding: 12,
        fontWeight: 600,
        fontSize: 12,
        width: 200,
        textAlign: "center" as const,
        whiteSpace: "pre-line" as const,
      },
    });

    // Distribute dependencies around the IBS, ringed by criticality
    const ringRadius = { CRITICAL: 240, IMPORTANT: 380, SUPPORTING: 520 };
    const byRing: Record<"CRITICAL" | "IMPORTANT" | "SUPPORTING", Resource[]> = {
      CRITICAL: [],
      IMPORTANT: [],
      SUPPORTING: [],
    };
    for (const r of resources) byRing[r.criticality].push(r);

    for (const crit of ["CRITICAL", "IMPORTANT", "SUPPORTING"] as const) {
      const ring = byRing[crit];
      const count = ring.length;
      const r = ringRadius[crit];
      ring.forEach((res, i) => {
        const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.round(Math.cos(angle) * r);
        const y = Math.round(Math.sin(angle) * r);
        const sharedCount = (sharedBy[res.label.toLowerCase()] ?? []).length;
        nodes.push({
          id: `res-${res.id}`,
          data: { label: `${res.label}${sharedCount > 0 ? ` (+${sharedCount})` : ""}` },
          position: { x, y },
          style: {
            background: KIND_COLOR[res.kind] + "22",
            border: `2px solid ${CRIT_BORDER[res.criticality]}`,
            borderRadius: 10,
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 500,
            color: "#1e293b",
            minWidth: 90,
            textAlign: "center" as const,
          },
        });
        edges.push({
          id: `e-self-${res.id}`,
          source: "ibs-self",
          target: `res-${res.id}`,
          style: {
            stroke: CRIT_BORDER[res.criticality],
            strokeWidth: crit === "CRITICAL" ? 2.5 : 1.5,
          },
        });
      });
    }

    // Peer IBSs sharing one or more deps — placed on a far ring with dashed edges
    const peers = new Map<string, { peer: SharedPeer; sharedLabels: string[] }>();
    for (const res of resources) {
      const list = sharedBy[res.label.toLowerCase()] ?? [];
      for (const p of list) {
        const entry = peers.get(p.id);
        if (entry) {
          entry.sharedLabels.push(res.label);
        } else {
          peers.set(p.id, { peer: p, sharedLabels: [res.label] });
        }
      }
    }
    let pIdx = 0;
    const peerCount = peers.size;
    const peerRadius = 720;
    for (const { peer, sharedLabels } of peers.values()) {
      const angle = (pIdx / Math.max(peerCount, 1)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.round(Math.cos(angle) * peerRadius);
      const y = Math.round(Math.sin(angle) * peerRadius);
      nodes.push({
        id: `peer-${peer.id}`,
        data: { label: `${peer.code}\n${peer.name}` },
        position: { x, y },
        style: {
          background: "#fef3c7",
          border: "2px dashed #d97706",
          borderRadius: 10,
          padding: 8,
          fontSize: 11,
          fontWeight: 500,
          color: "#78350f",
          width: 140,
          textAlign: "center" as const,
          whiteSpace: "pre-line" as const,
        },
      });
      for (const lbl of sharedLabels) {
        const r = resources.find((x) => x.label.toLowerCase() === lbl.toLowerCase());
        if (!r) continue;
        edges.push({
          id: `e-peer-${peer.id}-${r.id}`,
          source: `res-${r.id}`,
          target: `peer-${peer.id}`,
          animated: true,
          label: lbl,
          labelStyle: { fontSize: 9, fill: "#78350f" },
          style: { stroke: "#d97706", strokeDasharray: "4 3" },
        });
      }
      pIdx++;
    }

    return { nodes, edges };
  }, [ibsCode, ibsName, resources, sharedBy]);

  return (
    <div className="h-[640px] w-full overflow-hidden rounded-lg border border-line bg-surface-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls position="bottom-left" />
        <MiniMap nodeStrokeWidth={3} pannable zoomable />
      </ReactFlow>
    </div>
  );
}
