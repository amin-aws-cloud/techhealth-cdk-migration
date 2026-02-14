// Import necessary CDK libraries and constructs
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

export class TechhealthCdkMigrationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with 2 AZs, 1 public and 1 private isolated subnet in each AZ
    const vpc = new ec2.Vpc(this, "TechHealthVPC", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "PublicSubnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "PrivateSubnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Output the VPC ID in CloudFormation outputs for easy reference
    new cdk.CfnOutput(this, "VPCId", {
      value: vpc.vpcId,
      description: "VPC ID",
    });

    // Security Group for EC2 instances to allow SSH & HTTP traffic
    const ec2SecurityGroup = new ec2.SecurityGroup(this, "EC2SecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description:
        "Security group for EC2 instances allowing SSH and HTTP traffic",
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access from anywhere",
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP access from anywhere",
    );

    // Security Group for RDS instances to allow MySQL traffic from EC2 instances
    const rdsSecurityGroup = new ec2.SecurityGroup(this, "RDSSecurityGroup", {
      vpc,
      allowAllOutbound: true,
      description:
        "Security group for RDS instances allowing MySQL traffic from EC2 instances",
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      "Allow MySQL access from EC2 instances",
    );

    // IAM Role for EC2 Instance to allow SSM access for management & monitoring
    const ec2Role = new iam.Role(this, "EC2InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonSSMManagedInstanceCore",
      ),
    );

    // Deploy EC2 Instance in the Public Subnet
    const ec2Instance = new ec2.Instance(this, "TechHealthEC2Instance", {
      vpc,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      keyName: "techhealth-keypair",
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
    });

    // Output the EC2 Public IP in CloudFormation outputs for easy reference
    new cdk.CfnOutput(this, "EC2PublicIP", {
      value: ec2Instance.instancePublicIp,
      description: "EC2 Public IP Address",
    });
  }
}
