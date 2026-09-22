const http = require('http');
const fs = require('fs');
const url = require('url');


const port = process.env.PORT || process.env.NODE_PORT || 3000;

const indexPage = fs.readFileSync(`${__dirname}/../client/client.html`);
const styleCss = fs.readFileSync(`${__dirname}/../client/style.css`);

const makeResponse = (message, id, acceptTypes) => {
    if (acceptTypes.includes('text/xml')) {
        let xml = '<response>';
        xml += `<message>${message}</message>`;
        if (id) {
            xml += `<id>${id}</id>`;
        }
        xml += '</response>';

        return {
            type: 'text/xml',
            content: xml,
        };
    }

    const json = { message };
    if (id) {
        json.id = id;
    }

    return {
        type: 'application/json',
        content: JSON.stringify(json),
    };
};

const onRequest = (request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    const params = parsedUrl.query;

    const acceptHeader = request.headers.accept || '';
    const acceptTypes = acceptHeader.split(',').map((type) => type.trim());

    const sendResponse = (code, message, id) => {
        const responseInfo = makeResponse(message, id, acceptTypes);
        response.writeHead(code, { 'Content-Type': responseInfo.type });
        response.write(responseInfo.content);
        response.end();
    };

    switch (pathname) {
        case '/':
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(indexPage);
            response.end();
            break;

        case '/style.css':
            response.writeHead(200, { 'Content-Type': 'text/css' });
            response.write(styleCss);
            response.end();
            break;

        case '/success':
            sendResponse(200, 'This is a successful response.');
            break;

        case '/badRequest':
            if (params.valid === 'true') {
                sendResponse(200, 'This request has the valid parameter set to true.');
            } else {
                sendResponse(400, 'Missing valid query parameter set to true.', 'badRequest');
            }
            break;

        case '/unauthorized':
            if (params.loggedIn === 'yes') {
                sendResponse(200, 'You have access to top secret content.');
            } else {
                sendResponse(401, 'Missing loggedIn query parameter set to yes.', 'unauthorized');
            }
            break;

        case '/forbidden':
            sendResponse(403, 'You do not have access to this content.', 'forbidden');
            break;

        case '/internal':
            sendResponse(500, 'Internal Server Error. Something went wrong.', 'internalError');
            break;

        case '/notImplemented':
            sendResponse(501, 'A request for this page has not been implemented yet.', 'notImplemented');
            break;

        default:
            sendResponse(404, 'The page you are looking for was not found.', 'notFound');
            break;
    }
};

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127.0.0.1: ${port}`);
});