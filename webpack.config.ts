import * as databases from './database';
import * as fs from 'fs';
import * as path from 'path';
import * as readPkg from 'read-pkg';
import * as uglify from 'uglify-es';
import * as webpack from 'webpack';
import importToArray from 'import-to-array';
import { inspect } from 'logspect/bin';
import StartServerPlugin = require('start-server-webpack-plugin');

// Hack for Ubuntu on Windows: interface enumeration fails with EINVAL, so return empty.
try {
    require('os').networkInterfaces()
}
catch (e) {
    require('os').networkInterfaces = () => ({})
}

const pkg = readPkg.sync();
const production = process.env["NODE_ENV"] === "production";
const isWatching = process.argv.indexOf("--watch") > -1;

/**
 * Takes a list of plugins and only returns those that are not undefined. Useful when you only pass plugins in certain conditions.
 */
function filterPlugins(plugins: webpack.Plugin[]) {
    return (plugins || []).filter(plugin => !!plugin);
}

const baseConfig: webpack.Configuration = {
    output: {
        filename: "[name].js",
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js', '.styl', '.stylus']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {}
                    }
                ]
            },
            {
                test: /\.styl[us]?$/,
                use: ["style-loader", "css-loader", "stylus-loader"]
            }
        ],
    },
    devtool: "source-map",
    plugins: filterPlugins([
        production ? undefined : new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
            "_VERSION": `"${pkg.version}"`,
            "NODE_ENV": `"${process.env.NODE_ENV}"` || `"development"`
        })
    ]),
    externals: {

    }
}

const clientConfig: webpack.Configuration = {
    ...baseConfig,
    entry: {
        "client": "./client.tsx"
    },
    output: {
        ...baseConfig.output,
        // Important: publicPath must begin with a / but must not end with one. Else hot module replacement won't find updates.
        publicPath: "/dist",
        path: path.join(__dirname, "dist")
    },
    plugins: filterPlugins([
        ...baseConfig.plugins,
        production ? undefined : new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            "process.env": {
                "NODE_ENV": `"${process.env.NODE_ENV}"` || `"development"`,
            }
        })
        // TODO: Add an uglify plugin here that supports es2015 (uglify-es)
    ])
}

const serverConfig: webpack.Configuration = {
    ...baseConfig,
    entry: {
        "server": "./server.ts"
    },
    output: {
        ...baseConfig.output,
        // Important: publicPath must begin with a / but must not end with one. Else hot module replacement won't find updates.
        publicPath: "/bin",
        path: path.join(__dirname, "bin"),
        libraryTarget: "commonjs",
    },
    target: "node",
    // Turn off the Node polyfill plugin, which polyfills things like __dirname to "/" instead of the real __dirname.
    node: false as any,
    plugins: filterPlugins([
        ...baseConfig.plugins,
        isWatching ? new StartServerPlugin({
            name: 'server.js',
            nodeArgs: [/* '--inspect' */], // This plugin has suddenly stopped working when passing --inspect. Need to investigate. 
            args: [], // pass args to script
        }) : undefined,
        new webpack.BannerPlugin({
            banner: "require('source-map-support').install();",
            raw: true,
            entryOnly: false
        } as webpack.BannerPlugin.Options),
        new webpack.DefinePlugin({
            _DB_CONFIGURATIONS: JSON.stringify(importToArray(databases).map(db => db.Config))
        }),
        {
            apply: (compiler) => {
                let doneHandlerSet = false;
                let counter = 0;

                compiler.plugin("watch-run", (watcher, callback) => {
                    inspect("Watch handler called");

                    if (!doneHandlerSet) {
                        inspect("Setting done handler")

                        doneHandlerSet = true;

                        compiler.plugin("done", (compilation) => {
                            inspect("Compiler's done handler was called", counter);

                            counter++;
                        })
                    }

                    return callback();
                })

            }
        }
    ]),
    externals: {
        ...baseConfig.externals as any,
        // Set all node_modules to external to prevent bundling them unnecessarily
        ...fs.readdirSync('node_modules').filter(x => [".bin"].indexOf(x) === -1).reduce((output, mod) => {
            output[mod] = 'commonjs ' + mod;

            return output
        }, {})
    }
}

export =[clientConfig, serverConfig]