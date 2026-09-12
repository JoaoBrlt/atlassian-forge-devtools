import { Badge } from "@/components/ui/badge";
import type { AtlassianResponse } from "@/types/atlassian";
import { isForgeTrpcResponse } from "@/utils/forge-trpc-utils";

export interface TrpcResponseStatusBadgeProps {
  response: AtlassianResponse;
}

function TrpcResponseStatusBadge({ response }: TrpcResponseStatusBadgeProps) {
  if (!isForgeTrpcResponse(response)) {
    return null;
  }
  if ("error" in response.trpc) {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="success">Success</Badge>;
}

export default TrpcResponseStatusBadge;
