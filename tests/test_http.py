import json
import threading
import unittest
import urllib.error
import urllib.request

from server import Handler, ThreadingHTTPServer


class HTTPIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_editor_and_examples_available(self):
        with urllib.request.urlopen(self.base + '/') as response:
            self.assertIn(b'<html', response.read().lower())
        with urllib.request.urlopen(self.base + '/api/examples') as response:
            self.assertTrue(json.load(response)['examples'])

    def test_custom_code_executes_and_failure_recovers(self):
        def request(code):
            return urllib.request.Request(
                self.base + '/api/trace',
                json.dumps({'code': code}).encode(),
                {'Content-Type': 'application/json'},
            )
        with self.assertRaises(urllib.error.HTTPError) as failure:
            urllib.request.urlopen(request('int main( {'))
        self.assertEqual(failure.exception.code, 400)
        with urllib.request.urlopen(request('int main(){int x=13; printf("%d",x);return 0;}')) as response:
            result = json.load(response)
        self.assertEqual(result['output'], '13')
        self.assertTrue(result['steps'])


if __name__ == '__main__':
    unittest.main()
