
var basename = require('path').basename;
var debug = require('debug')('metalsmith-markdown');
var dirname = require('path').dirname;
var extname = require('path').extname;
var join = require('path').join;
var markdownIt = require('markdown-it');
var minimatch = require('minimatch');
var multimatch = require('multimatch');
var _ = require('deepdash')(require('lodash'));

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Metalsmith plugin to convert markdown files.
 *
 * @param {Object}       options (optional) - options to pass to markdownIt
 * @param {Object}       options.plugin (optional) - options used by the plugin. Will not be passed to MarkdownIt
 * @param {string}       options.plugin.pattern - glob pattern for filtering which files to process (passed to minimatch.filter)
 * @param {string|Array} options.plugin.fields - field or list of fields which MarkdownIt should process
 * @param {string}       options.plugin.extension - file extension for output files
 * @return {Function}
 */

function plugin(preset, options){
  var defaults = {
    pattern: '**/*.@(md|markdown)',
    fields: 'contents',
    extension: 'html'
  }
  var pluginOptions = defaults;

  // handle cases where a preset isn't specified
  var pluginOpts = false;
  if (options && options.plugin) {
    pluginOpts = options.plugin;
    delete options.plugin;
  } else if (!options && typeof preset === 'object' && preset.plugin){
    pluginOpts = preset.plugin;
    delete preset.plugin;
  }

  if (pluginOpts) {
    // merge defaults with supplied options
    for (var prop in pluginOpts) {
      pluginOptions[prop] = pluginOpts[prop];
    }
  }
  // normalize pluginOptions.fields into an array
  if (typeof pluginOptions.fields === 'string') pluginOptions.fields = [pluginOptions.fields]

  var markdown = new markdownIt(preset, options),
      envSetter = function(){};

  var plugin = function(files, metalsmith, done){
    setImmediate(done);
    Object.keys(files).filter(minimatch.filter(pluginOptions.pattern)).forEach(function(file){
      var data = files[file];
      var dir = dirname(file);
      var html = basename(file, extname(file)) + '.' + pluginOptions.extension;
      if (dir !== '.') html = join(dir, html);

      var env = {};
      if (envSetter) {
        env = envSetter(data, metalsmith.metadata());
      }

      debug('converting file: %s', file);
      all_paths = _.paths(data ,{ leavesOnly: false });
      fields_path = multimatch(all_paths, pluginOptions.fields, {matchBase: true });
      debug('- searching for the fields: %s',  pluginOptions.fields);
      debug('- fields found to convert: %s', fields_path);

      fields_path.forEach(function(path){
          debug('- converting field: %s', path);
          var str = markdown.render(_.get(data, path).toString(), env);
          _.set(data, path, new Buffer(str));
      })

      delete files[file];
      files[html] = data;
    });
  };

  plugin.parser = markdown;

  /* proxy parser methods to return plugin for inline use */

  ['use', 'set', 'enable', 'disable'].forEach(function(fn){
    plugin[fn] = function(){
      var args = Array.prototype.slice.call(arguments);
      markdown[fn].apply(markdown, args);
      return plugin;
    }
  });

  plugin.env = function(setter){
    envSetter = setter;
    return plugin;
  }

  plugin.withParser = function(fn){
    fn(markdown);
    return plugin;
  }

  return plugin;
}
