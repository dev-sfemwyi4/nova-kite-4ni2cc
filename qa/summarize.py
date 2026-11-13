import json,sys
for ln in open(sys.argv[1]):
    m,_,r=ln.strip().partition(' ')
    try: o=json.loads(json.loads(r))
    except Exception as e: print(m,'PARSE',r[:300]); continue
    e=o.get('errs',{})
    print(m, (o.get('crash') or '')[:400], o.get('winner'), o.get('reason'), 'sim',o.get('sim'),'dep',o.get('dep'),'maxU',o.get('maxU'),'ot',o.get('overtime'),'end',o.get('endCalls'), 'tr',o.get('prof0',{}).get('tr'),'->',o.get('prof1',{}).get('tr'),'g',o.get('prof0',{}).get('gold'),'->',o.get('prof1',{}).get('gold'),'med',o.get('renderMed'),'p95',o.get('renderP95'),'wall',o.get('wall'),'scr',o.get('screen'),o.get('modal'), {k:v for k,v in e.items() if v})
