import json,sys,re
for ln in open(sys.argv[1]):
    m,_,r=ln.strip().partition(' ')
    if not r.startswith('"'): print(ln.strip()[:200]); continue
    try: o=json.loads(json.loads(r))
    except Exception as e: print(m,'PARSE'); continue
    e={k:v for k,v in o.get('errs',{}).items() if v}
    print(m,'med',o.get('renderMed'),'p95',o.get('renderP95'),'perU',o.get('msPerUnitMed'),'meanU',o.get('meanUnits'),'maxU',o.get('maxU'),'wall',o.get('wall'),'mem',o.get('mem'),'renders',o.get('stats',{}).get('renders'),'def',o.get('stats',{}).get('deferred'),e)
