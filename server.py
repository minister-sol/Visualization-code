from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json, argparse
from backend.engine import trace
ROOT=Path(__file__).parent/'web'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def send_json(self,obj,status=200):
  data=json.dumps(obj,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def do_GET(self):
  if self.path=='/api/examples':
   from backend.examples import EXAMPLES
   return self.send_json({'examples':EXAMPLES})
  return super().do_GET()
 def do_POST(self):
  if self.path!='/api/trace':return self.send_json({'error':'接口不存在'},404)
  try:
   size=int(self.headers.get('Content-Length',0))
   if size>100000:raise ValueError('请求过大')
   body=json.loads(self.rfile.read(size));result=trace(body['code'],body.get('stdin',''));self.send_json(result)
  except Exception as e:self.send_json({'error':str(e),'status':'error','line':getattr(e,'line',None),'steps':getattr(e,'steps',[]),'output':getattr(e,'output',''),'preprocessed_source':getattr(e,'preprocessed_source','')},400)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8000);a=p.parse_args();print('C Visualizer http://127.0.0.1:'+str(a.port));ThreadingHTTPServer(('127.0.0.1',a.port),Handler).serve_forever()
