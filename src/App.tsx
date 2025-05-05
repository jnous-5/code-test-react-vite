import { JSX } from "react";
import { Input } from "src/components/ui/input";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";

interface ItemProps {
  name: string;
  status: "upcoming" | "success" | "failed";
}
function Item({ name, status }: ItemProps): JSX.Element {
  return (
    <div className="p-3 border rounded shadow-md">
      <div className="flex py-1 mb-2 gap-2 font-bold text-2xl items-start">
        {name}
        <div
          className={cn(
            "text-sm px-2 py-[2px] -mt-1",
            status === "upcoming" ? "bg-cyan-300" : "",
            status === "success" ? "bg-green-300" : "",
            status === "failed" ? "bg-red-300" : ""
          )}
        >
          {status}
        </div>
      </div>
      <Button className="!bg-blue-500">View</Button>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <div className="container p-5 m-auto">
      <div className="mb-10">
        <Input type="text" placeholder="Search..." />
      </div>

      <Item name="GPS SV05" status="upcoming" />
    </div>
  );
}
