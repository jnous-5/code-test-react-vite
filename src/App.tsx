import { JSX, useDeferredValue, useEffect, useRef, useState } from "react";
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

function timeAgo(timestamp: number) {
  if (!timestamp) return "in a year";

  const now = new Date();
  const past = new Date(timestamp * 1000);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

function Item({ id, name, status }: ItemProps): JSX.Element {
  const [data, setData] = useState<{
    date: number;
    articleLink: string;
    videoLink: string;
    description: string;
    imageSrc: string;
  }>();

  const fetchData = async () => {
    try {
      const { data } = await axios.get(
        `https://api.spacexdata.com/v3/launches/${id}`
      );
      console.log(data);
      setData({
        date: data.launch_date_unix,
        articleLink: data.links.article_link,
        videoLink: data.links.video_link,
        description: data.details,
        imageSrc: data.links.mission_patch,
      });
    } catch (_) {
      // no-op
    }
  };

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

      {data && (
        <div className="">
          <div>
            <span className="border-r mr-1 pr-1 inline-block">
              {timeAgo(data.date)}
            </span>
            {data.articleLink && (
              <a
                target="_blank"
                href={data.articleLink}
                className="border-r mr-1 pr-1 inline-block"
              >
                Article
              </a>
            )}
            {data.videoLink && (
              <a target="_blank" href={data.videoLink} className="inline-block">
                Video
              </a>
            )}
          </div>
          <div className="flex py-3">
            {data.imageSrc ? (
              <img className="block w-25 m-w-25" src={data.imageSrc} />
            ) : (
              <p className="p-3">No image yet.</p>
            )}
            <p className="p-3">{data.description || "No description yet."}</p>
          </div>
        </div>
      )}

      <Button
        className="!bg-blue-500"
        onClick={() => {
          if (data) {
            setData(undefined);
            return;
          }

          fetchData();
        }}
      >
        {data ? "Hide" : "View"}
      </Button>
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

  const [query, setQuery] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(query);
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

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
      } catch (_) {
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
      const data = response.data.map((item) => ({
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
    } catch (_) {
      setIsLoadingPagination(false);
    }
  };

  const filteredLaunches = !debouncedValue.trim()
    ? launches
    : launches.filter((item) =>
        item.name.toLowerCase().includes(debouncedValue.toLowerCase())
      );

  return (
    <div className="container p-5 m-auto">
      <div className="mb-10">
        <Input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="h-[700px] overflow-auto">
        {isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <List list={filteredLaunches} />
            <InfiniteScroll
              onIntersect={() => {
                if (!hasNextPage) return;
                if (isLoading || isLoadingPagination) return;
                if (debouncedValue) return;
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
