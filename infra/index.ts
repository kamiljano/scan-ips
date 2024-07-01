import { Namespace } from "@pulumi/kubernetes/core/v1";
import { ConfigFile } from "@pulumi/kubernetes/yaml";
import * as path from "node:path";
import * as fs from "node:fs";
import { CustomResource } from "@pulumi/kubernetes/apiextensions";
import * as yaml from "js-yaml";

const argoNamespaceName = "argo";
new Namespace(argoNamespaceName, {
  metadata: {
    name: argoNamespaceName,
  },
});

export const argo = new ConfigFile("argo", {
  file: "https://raw.githubusercontent.com/argoproj/argo-workflows/master/manifests/quick-start-postgres.yaml",
  transformations: [
    (obj: any) => {
      if (obj.metadata) {
        obj.metadata.namespace = argoNamespaceName;
      }
    },
  ],
});

const ccScanWorkflowTemplate = fs.readFileSync(
  path.join(__dirname, "scan-cc-template.yaml"),
  "utf-8",
);

new CustomResource("scan-cc", yaml.load(ccScanWorkflowTemplate) as any);
