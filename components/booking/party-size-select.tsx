"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIZES = Array.from({ length: 10 }, (_, i) => i + 1);

export function PartySizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (size: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="party-size">Party size</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="party-size" className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIZES.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size} {size === 1 ? "guest" : "guests"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
