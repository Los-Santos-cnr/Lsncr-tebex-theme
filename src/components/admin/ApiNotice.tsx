import { CardBody } from "@/components/ui/Card";

export function ApiNotConfiguredNotice() {
  return (
    <div className="lscnr-panel rounded-md">
      <CardBody className="space-y-2 p-6 text-sm">
        <p className="font-medium text-foreground">Tebex Plugin API is not configured.</p>
        <p className="text-muted-foreground">
          Set the <code className="text-gold">TEBEX_SECRET_KEY</code> environment variable (your game
          server secret from the Tebex Creator panel) to use this section.
        </p>
      </CardBody>
    </div>
  );
}

export function ApiErrorNotice({ message }: { message: string }) {
  return (
    <div className="lscnr-panel rounded-md">
      <CardBody className="space-y-1 p-6 text-sm">
        <p className="font-medium text-danger">Could not reach the Tebex Plugin API.</p>
        <p className="text-muted-foreground">{message}</p>
      </CardBody>
    </div>
  );
}
