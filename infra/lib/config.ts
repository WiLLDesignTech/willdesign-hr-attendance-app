export type Stage = "dev" | "prod";

export interface EnvironmentConfig {
  stage: Stage;
  prefix: string;
  tableName: string;
  region: string;
  removalPolicy: "destroy" | "retain";
}

export function getConfig(stage: Stage): EnvironmentConfig {
  const prefix = stage === "prod" ? "willdesign-hr" : "willdesign-hr-dev";

  return {
    stage,
    prefix,
    tableName: `${prefix}-table`,
    region: "ap-northeast-1",
    removalPolicy: stage === "prod" ? "retain" : "destroy",
  };
}
