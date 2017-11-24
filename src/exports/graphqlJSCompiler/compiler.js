import {promisify} from 'util';
import fs from 'fs';
import path from 'path';
import {printSchema} from 'graphql/utilities';
import webpack from 'webpack';

const webpackAsync = promisify(webpack);

const printErrors = (summary, errors) => {
  console.log(summary);
  errors.forEach(err => {
    console.log(err.message || err);
  });
};

export default async (schemaPath, srcDir) => {
  console.log('transpiling graphql-js with webpack');
  const webpackConfig = require(schemaPath);

  let rawStats;
  try {
    rawStats = await webpackAsync([webpackConfig]);
  } catch (err) {
    return printErrors('Failed to compile.', [err]);
  }

  const stats = rawStats.toJson();
  if (stats.errors.length) {
    return printErrors('Failed to compile.', stats.errors);
  }

  const transpiled = path.resolve(webpackConfig.output.path, webpackConfig.output.filename);
  const schema = require(transpiled).default;
  const outputDest = path.resolve(srcDir, './schema.graphql');

  fs.writeFileSync(outputDest, printSchema(schema));
  fs.unlinkSync(transpiled);

  console.log('Successfully compiled graphql-js.');
  return outputDest;
};