import { useState } from 'react';
import { Users, Plus, Trash2, Check, X, ChevronRight, Sparkles, Loader, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ai } from './utils/ai';

interface ActionItem { id:string; text:string; owner:string; done:boolean; }
interface Meeting { id:string; title:string; date:string; attendees:string; agenda:string; notes:string; actions:ActionItem[]; aiSummary:string; createdAt:number; }

const SAVE='ms_meetings_v1';
const load=():Meeting[]=>{ try{return JSON.parse(localStorage.getItem(SAVE)||'[]')}catch{return []} };

export default function App() {
  const [meetings,setMeetings]=useState<Meeting[]>(load);
  const [view,setView]=useState<'list'|'edit'>('list');
  const [current,setCurrent]=useState<Meeting|null>(null);

  const save=(items:Meeting[])=>{ setMeetings(items); localStorage.setItem(SAVE,JSON.stringify(items)); };

  if(view==='edit') return <MeetingEditor meeting={current} onSave={m=>{
    const u=meetings.find(x=>x.id===m.id)?meetings.map(x=>x.id===m.id?m:x):[m,...meetings];
    save(u); setView('list');
  }} onBack={()=>setView('list')}/>;

  const pendingActions=meetings.flatMap(m=>m.actions.filter(a=>!a.done)).length;

  return (
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'16px 20px',borderBottom:'1px solid #14331450',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'linear-gradient(135deg,#22c55e,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px #22c55e30'}}><Users size={16} color="white"/></div>
          <div><div style={{fontWeight:'700',fontSize:'16px',color:'white',lineHeight:1}}>MeetingScribe</div>
          <div style={{fontSize:'11px',color:'#14532d',marginTop:'2px'}}>{meetings.length} meetings · {pendingActions} pending actions</div></div>
        </div>
        <button onClick={()=>{setCurrent(null);setView('edit');}} style={{display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',background:'#22c55e',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 12px #22c55e30'}}>
          <Plus size={13}/> New meeting
        </button>
      </header>
      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        {pendingActions>0&&<div style={{background:'#22c55e10',border:'1px solid #22c55e25',borderRadius:'12px',padding:'14px',marginBottom:'14px'}}>
          <div style={{fontSize:'12px',color:'#86efac',fontWeight:'600',marginBottom:'8px'}}>⚡ {pendingActions} pending action item{pendingActions!==1?'s':''}</div>
          {meetings.flatMap(m=>m.actions.filter(a=>!a.done).map(a=>({...a,meeting:m.title}))).slice(0,3).map(a=>(
            <div key={a.id} style={{fontSize:'13px',color:'#4ade80',marginBottom:'3px'}}>• {a.text}{a.owner?` (${a.owner})`:''}</div>
          ))}
        </div>}
        {meetings.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:'52px',marginBottom:'16px'}}>🎤</div>
            <h3 style={{fontSize:'20px',fontWeight:'700',color:'white',marginBottom:'8px'}}>No meetings yet</h3>
            <p style={{color:'#14532d',fontSize:'14px',marginBottom:'24px',lineHeight:'1.6',maxWidth:'240px',margin:'0 auto 24px'}}>Record your first meeting with agenda, notes, and action items.</p>
            <button onClick={()=>{setCurrent(null);setView('edit');}} style={{padding:'12px 24px',borderRadius:'10px',background:'#22c55e',border:'none',color:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:'0 4px 16px #22c55e30'}}>Add first meeting</button>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {[...meetings].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(m=>{
              const pending=m.actions.filter(a=>!a.done).length;
              return <div key={m.id} style={{background:'#0a1a0a',border:'1px solid #14331450',borderRadius:'12px',padding:'14px',cursor:'pointer',transition:'all 0.2s'}}
                onClick={()=>{setCurrent(m);setView('edit');}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#22c55e30'} onMouseLeave={e=>e.currentTarget.style.borderColor='#14331450'}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'10px'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:'white',fontSize:'14px',fontWeight:'500',marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title||'Untitled Meeting'}</div>
                    <div style={{color:'#14532d',fontSize:'11px',marginBottom:'6px'}}>
                      <span style={{marginRight:'8px'}}>📅 {format(new Date(m.date),'MMM d, yyyy')}</span>
                      {m.attendees&&<span>👥 {m.attendees.split(',').length} attendee{m.attendees.split(',').length!==1?'s':''}</span>}
                    </div>
                    {pending>0&&<span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'4px',background:'#22c55e15',color:'#4ade80'}}>⚡ {pending} pending action{pending!==1?'s':''}</span>}
                  </div>
                  <button onClick={e=>{e.stopPropagation();const u=meetings.filter(x=>x.id!==m.id);save(u);}} style={{padding:'5px',background:'none',border:'none',cursor:'pointer',color:'#14532d',flexShrink:0}}><Trash2 size={13}/></button>
                </div>
              </div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingEditor({meeting,onSave,onBack}:{meeting:Meeting|null;onSave:(m:Meeting)=>void;onBack:()=>void}) {
  const [title,setTitle]=useState(meeting?.title||'');
  const [date,setDate]=useState(meeting?.date||new Date().toISOString().split('T')[0]);
  const [attendees,setAttendees]=useState(meeting?.attendees||'');
  const [agenda,setAgenda]=useState(meeting?.agenda||'');
  const [notes,setNotes]=useState(meeting?.notes||'');
  const [actions,setActions]=useState<ActionItem[]>(meeting?.actions||[]);
  const [newAction,setNewAction]=useState('');
  const [newOwner,setNewOwner]=useState('');
  const [aiSummary,setAiS]=useState(meeting?.aiSummary||'');
  const [aiLoad,setAiL]=useState(false);

  const inp={width:'100%',background:'#040a04',border:'1px solid #14331450',borderRadius:'10px',padding:'11px 14px',color:'white',fontSize:'13px',outline:'none',fontFamily:'Inter',transition:'border-color 0.2s'};

  const addAction=()=>{
    if(!newAction.trim())return;
    setActions([...actions,{id:crypto.randomUUID(),text:newAction.trim(),owner:newOwner.trim(),done:false}]);
    setNewAction(''); setNewOwner('');
  };

  const getSummary=async()=>{
    if(!notes.trim()||aiLoad)return;
    setAiL(true);
    const res=await ai(`Summarize this meeting in 3 bullet points:
Title: ${title}
Attendees: ${attendees}
Notes: ${notes.slice(0,600)}`, 'Summarize meeting with: key decisions, action items, and next steps. Use • bullet points. Be brief and clear.');
    setAiS(res); setAiL(false);
  };

  const save_=()=>onSave({id:meeting?.id||crypto.randomUUID(),title:title||'Untitled Meeting',date,attendees,agenda,notes,actions,aiSummary,createdAt:meeting?.createdAt||Date.now()});

  return (
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 20px',borderBottom:'1px solid #14331450',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={onBack} style={{color:'#4ade80',background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontFamily:'Inter'}}>← Back</button>
        <span style={{color:'white',fontSize:'14px',fontWeight:'600'}}>Meeting Notes</span>
        <button onClick={save_} style={{padding:'7px 14px',borderRadius:'8px',background:'#22c55e',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>Save</button>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'10px',maxWidth:'600px',margin:'0 auto'}}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Meeting title *" style={{...inp,fontSize:'18px',fontWeight:'600',background:'transparent',border:'none',borderBottom:'1px solid #14331450',borderRadius:0,padding:'0 0 12px'}} autoFocus onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
            <input value={attendees} onChange={e=>setAttendees(e.target.value)} placeholder="Attendees (comma-separated)" style={inp} onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
          </div>
          <textarea value={agenda} onChange={e=>setAgenda(e.target.value)} placeholder="Agenda items…" rows={2} style={{...inp,resize:'none',lineHeight:'1.6'}} onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Meeting notes, decisions, discussions…" rows={6} style={{...inp,resize:'none',lineHeight:'1.6'}} onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
          
          {/* AI Summary */}
          <div style={{background:'#0a1a0a',border:'1px solid #14331450',borderRadius:'12px',padding:'14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}><Sparkles size={13} style={{color:'#22c55e'}}/><span style={{fontSize:'11px',fontWeight:'700',color:'#86efac',textTransform:'uppercase',letterSpacing:'0.08em'}}>AI SUMMARY</span></div>
              <button onClick={getSummary} disabled={!notes.trim()||aiLoad} style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'7px',background:'#22c55e15',border:'1px solid #22c55e25',color:'#4ade80',fontSize:'11px',cursor:'pointer',fontFamily:'Inter'}}>
                {aiLoad?<Loader size={10} style={{animation:'spin 1s linear infinite'}}/>:<Sparkles size={10}/>} Generate
              </button>
            </div>
            {aiSummary?<p style={{fontSize:'13px',color:'#86efac',lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{aiSummary}</p>:<p style={{color:'#14532d',fontSize:'13px'}}>Click Generate to get an AI summary of your meeting notes.</p>}
          </div>

          {/* Action items */}
          <div style={{background:'#0a1a0a',border:'1px solid #14331450',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontSize:'12px',color:'#14532d',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px'}}>Action Items</div>
            {actions.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px',padding:'8px 10px',background:a.done?'#14532d20':'#052e1c20',borderRadius:'8px',cursor:'pointer'}} onClick={()=>setActions(actions.map(x=>x.id===a.id?{...x,done:!x.done}:x))}>
                <div style={{width:'16px',height:'16px',borderRadius:'4px',border:`1px solid ${a.done?'#22c55e':'#14532d'}`,background:a.done?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {a.done&&<Check size={10} color="white"/>}
                </div>
                <span style={{flex:1,fontSize:'13px',color:a.done?'#14532d':'#86efac',textDecoration:a.done?'line-through':'none'}}>{a.text}</span>
                {a.owner&&<span style={{fontSize:'11px',color:'#14532d',background:'#22c55e10',padding:'2px 7px',borderRadius:'4px'}}>{a.owner}</span>}
                <button onClick={e=>{e.stopPropagation();setActions(actions.filter(x=>x.id!==a.id));}} style={{padding:'2px',background:'none',border:'none',cursor:'pointer',color:'#14532d'}}><X size={11}/></button>
              </div>
            ))}
            <div style={{display:'flex',gap:'6px',marginTop:'8px'}}>
              <input value={newAction} onChange={e=>setNewAction(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addAction();}} placeholder="Add action item…" style={{...inp,flex:2,padding:'8px 12px',fontSize:'12px'}} onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
              <input value={newOwner} onChange={e=>setNewOwner(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addAction();}} placeholder="Owner" style={{...inp,flex:1,padding:'8px 12px',fontSize:'12px'}} onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='#14331450'}/>
              <button onClick={addAction} style={{padding:'8px 12px',borderRadius:'9px',background:'#22c55e',border:'none',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}><Plus size={13}/></button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}