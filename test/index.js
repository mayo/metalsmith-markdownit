
var assert = require('assert');
var equal = require('assert-dir-equal');
var Metalsmith = require('metalsmith');
var markdown = require('..');

describe('metalsmith-markdown', function(){
  it('should convert markdown files with no parameters', function(done){
    Metalsmith('test/fixtures/basic')
      .use(markdown())
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/basic/expected', 'test/fixtures/basic/build');
        done();
      });
  });

  it('should convert markdown files with presets', function(done){
    Metalsmith('test/fixtures/preset')
      .use(markdown('default'))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/preset/expected', 'test/fixtures/preset/build');
        done();
      });
  });

  it('should convert markdown files with options', function(done){
    Metalsmith('test/fixtures/options')
      .use(markdown({ html: true }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/options/expected', 'test/fixtures/options/build');
        done();
      });
  });

  it('should convert markdown files with preset and options combination', function(done){
    Metalsmith('test/fixtures/combo')
      .use(markdown('default', { typographer: true }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/combo/expected', 'test/fixtures/combo/build');
        done();
      });
  });

  it('should give access to markdown parser', function(done){
    var md = markdown('zero');
    md.parser.enable('emphasis');

    Metalsmith('test/fixtures/parser')
      .use(md)
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/parser/expected', 'test/fixtures/parser/build');
        done();
      });
  });

  it('should expose the markdown parser via proxy', function(done){
    Metalsmith('test/fixtures/parser')
      .use(markdown('zero').enable('emphasis'))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/parser/expected', 'test/fixtures/parser/build');
        done();
      });
  });

  it('should use plugins via the direct parser', function(done){
    var md = markdown('default');
    md.parser.use(require('markdown-it-abbr'));
    Metalsmith('test/fixtures/plugin')
      .use(md)
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/plugin/expected', 'test/fixtures/plugin/build');
        done()
      });
  });

  it('should be able to use a plugin', function(done){
    Metalsmith('test/fixtures/plugin')
      .use(markdown('default').use(require('markdown-it-abbr')))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/plugin/expected', 'test/fixtures/plugin/build');
        done();
      });
  });

  it('should be able to set the rendering environment per-page', function(done){
    Metalsmith('test/fixtures/env-plugin')
      .metadata({siteName: 'The test build'})
      .use(markdown('default')
           .env(function(page, metadata){ return {title: page.title, siteName: metadata.siteName}; })
           .use(function(md){
             md.inline.ruler.push('vars', function(state, silent){
               var pos = state.pos,
                   max = state.posMax;
               if (state.src.charCodeAt(pos) !== '@'.charCodeAt(0)) { return false; }
               while (pos < max) {
                 pos++;
                 if (state.md.utils.isSpace(state.src.charCodeAt(pos))){break;}
               }
               if (!silent) {
                 var name = state.src.slice(state.pos + 1, pos),
                     token = state.push('vars', '', 0);
                 token.markup = "@" + name;
                 token.content = state.env[name];
               }
               state.pos = pos;
               return true;
             });
             md.renderer.rules['vars'] = function(tokens, id, options, env, self){
               var token = tokens[id];
               return token.content;
             }
           }))
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/env-plugin/expected', 'test/fixtures/env-plugin/build');
        done();
      })
  })

  it('should accept plugin options', function(done){
    Metalsmith('test/fixtures/plugin-options')
      .use(markdown({
        plugin: {
          pattern: '**/*.html',
          fields: ['contents', 'excerpt'],
          extension: 'htm'
        }
      }))
      .use(function(files, metalsmith, done){
        var f = files['index.htm'];
        // concat the excerpt into the main content
        f.contents = f.contents.toString() + '\n' + f.excerpt.toString()
        done()
      })
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/plugin-options/expected', 'test/fixtures/plugin-options/build');
        done();
      });
  });

  it('should accept plugin options with a preset', function(done){
    Metalsmith('test/fixtures/plugin-options-preset')
      .use(markdown('default', {
        plugin: {
          pattern: '**/*.html',
          fields: ['contents', 'excerpt'],
          extension: 'htm'
        }
      }))
      .use(function(files, metalsmith, done){
        var f = files['index.htm'];
        // concat the excerpt into the main content
        f.contents = f.contents.toString() + '\n' + f.excerpt.toString()
        done()
      })
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/plugin-options-preset/expected', 'test/fixtures/plugin-options/build');
        done();
      });
  });

  it('should accept plugin options for subfields', function(done){
    Metalsmith('test/fixtures/plugin-options-subfield')
      .use(markdown({
        plugin: {
          pattern: '**/*.html',
          fields: ['contents', 'excerpt.subfield'],
          extension: 'htm'
        }
      }))
      .use(function(files, metalsmith, done){
        var f = files['index.htm'];
        // concat the excerpt into the main content
        f.contents = f.contents.toString() + '\n' + f.excerpt.subfield.toString()
        done()
      })
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/plugin-options-subfield/expected', 'test/fixtures/plugin-options-subfield/build');
        done();
      });
  });

  it('should accept plugin options for multiple subfields', function(done){
    Metalsmith('test/fixtures/plugin-options-multisubfield')
      .use(markdown({
        plugin: {
          pattern: '**/*.html',
          fields: ['contents', 'subfield'],
          extension: 'htm'
        }
      }))
      .use(function(files, metalsmith, done){
        var f = files['index.htm'];
        // concat the excerpt into the main content
        f.contents = f.contents.toString() + '\n' + f.excerpt[0].subfield.toString() + '\n' + f.excerpt[1].subfield.toString() + '\n' + f.main.submain.subfield.toString()
        done()
      })
      .build(function(err){
        if (err) return done(err);
        equal('test/fixtures/plugin-options-multisubfield/expected', 'test/fixtures/plugin-options-multisubfield/build');
        done();
      });
  });

});
