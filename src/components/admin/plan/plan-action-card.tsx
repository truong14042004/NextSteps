import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PlanActionCardProps = {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  darkButton?: boolean;
};

export function PlanActionCard({
  title,
  description,
  buttonText,
  icon: Icon,
  darkButton = false,
}: PlanActionCardProps) {
  return (
    <Card className="rounded-3xl border-border/60 bg-muted/30 shadow-sm">
      <CardContent className="flex items-center justify-between gap-4 p-7">
        <div className="max-w-sm">
          <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            {description}
          </p>

          <Button
            className={`mt-6 rounded-2xl px-6 ${
              darkButton
                ? "bg-foreground text-background hover:bg-foreground/90"
                : ""
            }`}
          >
            {buttonText}
          </Button>
        </div>

        <div className="hidden h-20 w-20 items-center justify-center rounded-3xl bg-background text-muted-foreground shadow-sm sm:flex">
          <Icon className="h-10 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}
