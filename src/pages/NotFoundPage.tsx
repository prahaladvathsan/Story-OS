import { Link } from "react-router-dom";
import { Button } from "../components/shared/Button";
import { EmptyState } from "../components/shared/EmptyState";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <EmptyState
        title="Page not found"
        description="This route does not exist in the current story graph."
        action={
          <Link to="/">
            <Button>Home</Button>
          </Link>
        }
      />
    </div>
  );
}
