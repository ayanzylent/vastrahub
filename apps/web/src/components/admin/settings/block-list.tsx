"use client";

import { ChevronUp, ChevronDown, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlockType, IHomepageBlock } from "@/types";
import { BLOCK_META, blockTitle } from "./block-meta";
import { AddBlockMenu } from "./add-block-menu";

interface BlockListProps {
  blocks: IHomepageBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAdd: (type: BlockType) => void;
}

export function BlockList({
  blocks,
  selectedId,
  onSelect,
  onToggleEnabled,
  onMove,
  onRemove,
  onAdd,
}: BlockListProps) {
  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
          No blocks yet. Add one to start building the homepage.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {blocks.map((block, index) => {
            const meta = BLOCK_META[block.type];
            const Icon = meta.icon;
            const active = block.id === selectedId;
            return (
              <li
                key={block.id}
                className={`group flex items-center gap-2 rounded-md border p-2 transition-colors cursor-pointer ${
                  active ? "border-primary/60 bg-primary/5" : "border-border/50 hover:bg-muted/30"
                } ${block.enabled ? "" : "opacity-60"}`}
                onClick={() => onSelect(block.id)}
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{blockTitle(block)}</p>
                  <p className="truncate text-xs text-muted-foreground">{meta.label}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title={block.enabled ? "Hide" : "Show"}
                    onClick={() => onToggleEnabled(block.id)}
                  >
                    {block.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => onMove(index, -1)}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === blocks.length - 1}
                    onClick={() => onMove(index, 1)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemove(block.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AddBlockMenu onAdd={onAdd} />
    </div>
  );
}
