import * as aws from '@pulumi/aws';

/**
 * For route53 to work the bucket must be named the same as the domain name.
 *
 * Unable to update the NS records on my domain registrar. So ill leave this as is for now.
 *
 * Pulumi tracks every file, so using pulumi to push a large number of files is really slow.
 * Just use the CLI:
 *    `aws s3 sync ../../../dist/apps/ymir-docs-site s3://$(pulumi stack output bucketName) --acl public-read`
 */

const siteBucket = new aws.s3.Bucket('s3-ymir-docs-website-bucket', {
  website: {
    indexDocument: 'index.html',
  },
});

function publicReadPolicyForBucket(bucketName: string) {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });
}

const bucketPolicy = new aws.s3.BucketPolicy(
  's3-ymir-docs-website-bucket-policy',
  {
    bucket: siteBucket.bucket,
    policy: siteBucket.bucket.apply(publicReadPolicyForBucket),
  }
);

exports.websiteUrl = siteBucket.websiteEndpoint;
exports.bucketName = siteBucket.bucket;
