import * as  Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import fs from 'fs'
import path from 'path';
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ServerStyleSheets, ThemeProvider } from '@material-ui/styles';
import App from '../app/App'
import theme from '../app/theme';

function serverRender(request, h) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve('./build/index.html'), 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject(new Boom.internal('An error occurred'));
            }
            const sheets = new ServerStyleSheets();
            const html = ReactDOMServer.renderToString(
                sheets.collect(
                    <ThemeProvider theme={theme}>
                        <App />
                    </ThemeProvider>
                )
            );
            const css = sheets.toString();
            let result = '';

            result = data.replace(
                '<div id="root"></div>',
                `<div id="root">${html}</div>`
            ).replace(
                '<style id="jss-server-side"></style>',
                `<style id="jss-server-side">${css}</style>`
            );

            resolve(result);
        });
    });
}

const start = async () => {

    const server = Hapi.server({
        routes: {
            files: {
                relativeTo: path.join(__dirname, '../../', 'build')
            }
        }
    });

    await server.register(require('@hapi/inert'));

    server.route([
        {
            method: 'GET',
            path: '/{param*}',
            handler: {
                directory: {
                    path: '.',
                    redirectToSlash: true,
                }
            }
        },
        {
            method: 'GET',
            path: '/',
            handler: serverRender
        }
    ]);

    await server.start();

    console.log('Server running at:', server.info.uri);
};

start();