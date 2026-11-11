"""Bounded-model integer prefix parsing, independent of host C libraries."""
def parse(text,base,error_type):
 if base!=0 and not 2<=base<=36:raise error_type('整数解析基数须为0或2到36')
 position=0
 while position<len(text) and text[position] in ' \t\n\r\v\f':position+=1
 sign=1
 if position<len(text) and text[position] in '+-':
  if text[position]=='-':sign=-1
  position+=1
 if base in (0,16) and text[position:position+2].lower()=='0x' and position+2<len(text) and text[position+2].lower() in '0123456789abcdef':base=16;position+=2
 elif base==0:base=8 if text[position:position+1]=='0' else 10
 start=position;value=0;digits='0123456789abcdefghijklmnopqrstuvwxyz'
 while position<len(text):
  digit=digits.find(text[position].lower())
  if digit<0 or digit>=base:break
  value=value*base+digit;position+=1
  if value>18446744073709551615:raise error_type('整数解析超出64位模型范围')
 return (sign*value,position) if position>start else (0,0)
