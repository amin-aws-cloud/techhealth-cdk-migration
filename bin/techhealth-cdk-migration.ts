#!/usr/bin/env node 
import * as cdk from "aws-cdk-lib/core";
import { TechhealthCdkMigrationStack } from "../lib/techhealth-cdk-migration-stack";

const app = new cdk.App();

new TechhealthCdkMigrationStack(app, "TechhealthCdkMigrationStack", {});

app.synth();
