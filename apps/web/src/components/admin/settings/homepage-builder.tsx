"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BlockType, IHomepageBlock } from "@/types";
import { BlockList } from "./block-list";
import { BlockEditor } from "./block-editor";
import { BLOCK_META, createBlock } from "./block-meta";

interface HomepageBuilderProps {
  blocks: IHomepageBlock[];
  onChange: (blocks: IHomepageBlock[]) => void;
}

export function HomepageBuilder({ blocks, onChange }: HomepageBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    onChange([...blocks, block]);
    setSelectedId(block.id);
  }

  function toggleEnabled(id: string) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  }

  function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(id: string) {
    const next = blocks.filter((b) => b.id !== id);
    onChange(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  }

  function updateBlock(updated: IHomepageBlock) {
    onChange(blocks.map((b) => (b.id === updated.id ? updated : b)));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: block list */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockList
              blocks={blocks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleEnabled={toggleEnabled}
              onMove={move}
              onRemove={remove}
              onAdd={addBlock}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right: editor */}
      <div className="lg:col-span-2">
        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit {BLOCK_META[selected.type].label}</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockEditor block={selected} onChange={updateBlock} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Select a section on the left to edit it, or add a new one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
