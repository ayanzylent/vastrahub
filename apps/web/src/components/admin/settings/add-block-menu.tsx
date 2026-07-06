"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BlockType } from "@vastrahub/shared-types";
import { BLOCK_META, BLOCK_TYPES } from "./block-meta";

export function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full">
          <Plus className="mr-1.5 h-4 w-4" /> Add block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {BLOCK_TYPES.map((type) => {
          const meta = BLOCK_META[type];
          const Icon = meta.icon;
          return (
            <DropdownMenuItem
              key={type}
              onClick={() => onAdd(type)}
              className="flex items-start gap-3 py-2"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
