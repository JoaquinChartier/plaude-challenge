import { withWorkflow } from "workflow/next";

const nextConfig = {
  serverExternalPackages: ["@slack/web-api"],
};

export default withWorkflow(nextConfig);
