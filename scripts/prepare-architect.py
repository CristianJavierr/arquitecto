"""Adapt Visage's second male avatar to atelier clothing. Sources in ATTRIBUTION.md."""
import copy,json,struct,sys

def read(path):
    b=open(path,'rb').read();n=struct.unpack_from('<I',b,12)[0]
    return json.loads(b[20:20+n]),bytearray(b[28+n:])

def prepare(character,clothes,output):
    dst,data=read(character);src,source_data=read(clothes);cache={}
    def transfer(kind,index):
        key=(kind,index)
        if key in cache:return cache[key]
        item=copy.deepcopy(src[kind][index])
        if kind=='bufferViews':
            while len(data)%4:data.append(0)
            start=item.get('byteOffset',0);item['byteOffset']=len(data)
            data.extend(source_data[start:start+item['byteLength']]);item['buffer']=0
        elif kind=='accessors':item['bufferView']=transfer('bufferViews',item['bufferView'])
        elif kind=='images':item['bufferView']=transfer('bufferViews',item['bufferView'])
        elif kind=='textures':
            item['source']=transfer('images',item['source'])
            if 'sampler' in item:item['sampler']=transfer('samplers',item['sampler'])
        elif kind=='materials':
            def textures(obj):
                for k,v in obj.items():
                    if isinstance(v,dict):
                        if k.endswith('Texture') and 'index' in v:v['index']=transfer('textures',v['index'])
                        else:textures(v)
            textures(item)
        elif kind=='meshes':
            for p in item['primitives']:
                p['attributes']={k:transfer('accessors',v) for k,v in p['attributes'].items()}
                if 'indices' in p:p['indices']=transfer('accessors',p['indices'])
                if 'material' in p:p['material']=transfer('materials',p['material'])
                for target in p.get('targets',[]):
                    for k,v in target.items():target[k]=transfer('accessors',v)
        result=len(dst.setdefault(kind,[]));dst[kind].append(item);cache[key]=result
        return result
    for name in ['Wolf3D_Outfit_Top','Wolf3D_Outfit_Bottom','Wolf3D_Outfit_Footwear']:
        donor=next(n for n in src['nodes'] if n.get('name')==name)
        node=next(n for n in dst['nodes'] if n.get('name')==name)
        node['mesh']=transfer('meshes',donor['mesh'])
    dst['buffers']=[{'byteLength':len(data)}]
    raw=json.dumps(dst,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4)
    data+=b'\0'*((-len(data))%4)
    glb=struct.pack('<4sII',b'glTF',2,28+len(raw)+len(data))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(data),b'BIN\0')+data
    open(output,'wb').write(glb)
if __name__=='__main__':prepare(*sys.argv[1:])
