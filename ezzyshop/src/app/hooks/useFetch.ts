import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useLoading } from "../loadingContext";

function useFetch(search: string | null) {
  const { setLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    if (!search) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/amazon?searchTerm=${encodeURIComponent(search)}`,
        );
        const data = await response.json();
        console.log(data);

        if (response.ok) {
          localStorage.setItem("products", JSON.stringify(data));
          router.push(`/products/${search}`);
        } else {
          toast.error(data.error);
        }
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, router, setLoading]);
}

export default useFetch;
