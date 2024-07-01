import { ComponentResource } from "@pulumi/pulumi";
import { ConfigFile } from "@pulumi/kubernetes/yaml";
import * as fs from "node:fs";
import * as path from "node:path";
import { CustomResource } from "@pulumi/kubernetes/apiextensions";
import * as yaml from "js-yaml";

interface ArgoWorkflowsProps {
  namespace: string;
}

export default class ArgoWorkflows extends ComponentResource {
  constructor(name: string, props: ArgoWorkflowsProps) {
    super("custom:resource:ArgoWorkflows", name);

    new ConfigFile("argo", {
      file: "https://raw.githubusercontent.com/argoproj/argo-workflows/master/manifests/quick-start-postgres.yaml",
      transformations: [
        (obj: any) => {
          if (obj.metadata) {
            obj.metadata.namespace = props.namespace;
          }
        },
      ],
    });

    const ccScanWorkflowTemplate = fs.readFileSync(
      path.join(__dirname, "..", "scan-cc-template.yaml"),
      "utf-8",
    );

    new CustomResource("scan-cc", yaml.load(ccScanWorkflowTemplate) as any);
  }
}
