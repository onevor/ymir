import { _export } from './export';
import * as dynamicImport from './dynamic-import';
import * as edit from './edit';
import * as get from './get-plugin';
import * as val from './validate';

const plugin = {
  dynamicImport,
  edit,
  export: _export,
  get,
  val,
};

export default plugin;
