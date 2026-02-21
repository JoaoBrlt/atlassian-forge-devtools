import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Download, Funnel, Trash, Upload, X } from "lucide-react";
import { ChangeEvent, useRef } from "react";

export interface ToolbarProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  onClearRequests: () => void;
  onHarImport: (file: File) => Promise<void>;
  onHarExport: () => void;
}

function Toolbar({ filter, onFilterChange, onClearRequests, onHarImport, onHarExport }: ToolbarProps) {
  const filterRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFilterChange(event.target.value);
  };

  const handleFilterClear = () => {
    onFilterChange("");
    filterRef.current?.focus();
  };

  const handleHarImportClick = () => {
    if (inputRef.current) {
      inputRef.current.value = ""; // Reset the file input
      inputRef.current.click();
    }
  };

  const handleHarImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files == null || files.length === 0) {
      console.error("No files were selected");
      return;
    }
    const file = files[0];
    if (file == null) {
      console.error("No file was selected");
      return;
    }
    event.target.value = ""; // Reset the file input
    void onHarImport(file);
  };

  const handleHarExportClick = () => {
    onHarExport();
  };

  return (
    <div className="flex flex-row gap-0 border border-border">
      <Button size="icon" variant="ghost" className="rounded-none" title="Clear requests" onClick={onClearRequests}>
        <Trash />
      </Button>
      <InputGroup className="rounded-none border-x border-y-0 border-border bg-background ring-0! dark:bg-background">
        <InputGroupAddon>
          <Funnel />
        </InputGroupAddon>
        <InputGroupInput
          ref={filterRef}
          className="text-xs"
          placeholder="Filter"
          value={filter}
          onChange={handleFilterChange}
        />
        {filter && (
          <InputGroupAddon align="inline-end">
            <Button size="icon-sm" variant="ghost" title="Clear" onClick={handleFilterClear}>
              <X />
            </Button>
          </InputGroupAddon>
        )}
      </InputGroup>
      <Button size="icon" variant="ghost" className="rounded-none" title="Import HAR" onClick={handleHarImportClick}>
        <Upload />
      </Button>
      <Button size="icon" variant="ghost" className="rounded-none" title="Export HAR" onClick={handleHarExportClick}>
        <Download />
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".har"
        multiple={false}
        onChange={handleHarImportChange}
      />
    </div>
  );
}

export default Toolbar;
