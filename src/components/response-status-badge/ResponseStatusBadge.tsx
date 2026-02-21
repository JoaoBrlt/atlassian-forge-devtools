import { Badge } from "@/components/ui/badge";
import { AtlassianResponse } from "@/types/atlassian";
import { getSafeStatusText } from "@/utils/http-utils";

export interface ResponseStatusBadgeProps {
  response: AtlassianResponse;
}

function getStatusVariant(status: number) {
  if (status >= 100 && status <= 399) {
    return "success";
  }
  if (status >= 400 && status <= 599) {
    return "destructive";
  }
  return "secondary";
}

function getStatusTitle(status: number): string {
  return `${status} ${getSafeStatusText(status)}`;
}

function ResponseStatusBadge({ response }: ResponseStatusBadgeProps) {
  switch (response.type) {
    case "invoke": {
      if (response.success) {
        return <Badge variant="success">Success</Badge>;
      }
      return <Badge variant="destructive">Failed</Badge>;
    }
    case "invokeRemote": {
      if (response.success) {
        const status = response.status;
        const variant = getStatusVariant(status);
        const title = getStatusTitle(status);
        return (
          <Badge variant={variant} title={title}>
            {status}
          </Badge>
        );
      }
      return <Badge variant="destructive">Failed</Badge>;
    }
  }
}

export default ResponseStatusBadge;
