import { Card, CardTitle, CardHeader } from "../components/ui";

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Card level={1} className="max-w-md text-center">
        <CardHeader className="justify-center">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <p className="font-body text-[15px] text-ink-500">
          Module under construction. Coming in the next build phase.
        </p>
      </Card>
    </div>
  );
}
