import { JSX, useEffect, useRef, useState } from "react";
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

interface InfiniteScrollProps {
  onIntersect?: () => void;
}

function InfiniteScroll({ onIntersect }: InfiniteScrollProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = ref.current;

    if (!div) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect?.();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    observer.observe(div);

    return () => observer.unobserve(div);
  }, [onIntersect]);

  return <div ref={ref} />;
}

export default function App(): JSX.Element {
  const pageNumberRef = useRef(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPagination, setIsLoadingPagination] = useState(false);
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
          data.map((item: Record<string, unknown>) => ({
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

  const loadMore = async () => {
    try {
      setIsLoadingPagination(true);
      const response = await axios.get(
        "https://api.spacexdata.com/v3/launches",
        {
          params: {
            limit: 14,
            offset: 14 * pageNumberRef.current,
          },
        }
      );
      const data = response.data.map((item: Record<string, unknown>) => ({
        id: item.flight_number,
        name: item.mission_name,
        status: item.upcoming
          ? "upcoming"
          : item.launch_success
          ? "success"
          : "failed",
      }));
      setLaunches((prev) => [...prev, ...data]);
      setHasNextPage(data.length !== 0);
      setIsLoadingPagination(false);
    } catch (error) {
      setIsLoadingPagination(false);
    }
  };

  return (
    <div className="container p-5 m-auto">
      <div className="mb-10">
        <Input type="text" placeholder="Search..." />
      </div>

      <div className="h-[700px] overflow-auto">
        {isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <List list={launches} />
            <InfiniteScroll
              onIntersect={() => {
                if (!hasNextPage) return;
                pageNumberRef.current += 1;
                loadMore();
              }}
            />
            {isLoadingPagination && (
              <div className="flex justify-center p-3">
                <Spinner />
              </div>
            )}

            {!hasNextPage && <p className="text-center p-3">End of list</p>}
          </>
        )}
      </div>
    </div>
  );
}
