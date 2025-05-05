import { JSX } from "react";
import "./App.css";
import { Input } from "src/components/ui/input";

export default function App(): JSX.Element {
  return (
    <div className="container">
      <div className="">
        <Input type="text" placeholder="Search..." />
      </div>
    </div>
  );
}
