import { JSX, useEffect, useState } from "react";
import { Input } from "src/components/ui/input";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import axios from "axios";
import Spinner from "./components/ui/spinner";

interface ItemProps {
  id: number;
  name: string;
  status: "upcoming" | "success" | "failed";
}
function Item({ id, name, status }: ItemProps): JSX.Element {
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

interface ListProps {
  list: Array<ItemProps>;
}

function List({ list }: ListProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      {list.map((item) => (
        <Item
          key={item.id}
          id={item.id}
          name={item.name}
          status={item.status}
        />
      ))}
    </div>
  );
}

export default function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [launches, setLaunches] = useState<ListProps["list"]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get(
          "https://api.spacexdata.com/v3/launches",
          {
            params: {
              limit: 14,
            },
          }
        );
        setLaunches(
          data.map((item) => ({
            id: item.flight_number,
            name: item.mission_name,
            status: item.upcoming
              ? "upcoming"
              : item.launch_success
              ? "success"
              : "failed",
          }))
        );
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetch();
  }, []);

  return (
    <div className="container p-5 m-auto">
      <div className="mb-10">
        <Input type="text" placeholder="Search..." />
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <List list={launches} />
      )}
    </div>
  );
}
