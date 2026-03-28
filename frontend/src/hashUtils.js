// Client-side hash computation — no backend dependency
// Uses SubtleCrypto for SHA family, pure JS for MD5/MD4/NTLM/MySQL323

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// --- SHA via SubtleCrypto ---
async function sha(algo, text) {
  const hash = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return bufToHex(hash)
}

// --- MD5 (RFC 1321) ---
function md5(str) {
  const bytes = utf8Encode(str)
  const len = bytes.length
  const bits = len * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  bytes.push(bits & 0xff, (bits >>> 8) & 0xff, (bits >>> 16) & 0xff, (bits >>> 24) & 0xff, 0, 0, 0, 0)

  const S = [7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21]
  const T = Array.from({length:64},(_,i)=>Math.floor(2**32*Math.abs(Math.sin(i+1)))>>>0)
  const G = [i=>i,(i)=>(5*i+1)%16,(i)=>(3*i+5)%16,(i)=>(7*i)%16]

  let [a0,b0,c0,d0] = [0x67452301,0xefcdab89,0x98badcfe,0x10325476]
  for (let off = 0; off < bytes.length; off += 64) {
    const M = new Array(16)
    for (let j = 0; j < 16; j++) M[j] = (bytes[off+j*4]) | (bytes[off+j*4+1]<<8) | (bytes[off+j*4+2]<<16) | (bytes[off+j*4+3]<<24)
    let [a,b,c,d] = [a0,b0,c0,d0]
    for (let i = 0; i < 64; i++) {
      const r = (i/16)|0
      let f
      if (r===0) f=(b&c)|((~b)&d); else if(r===1) f=(d&b)|((~d)&c); else if(r===2) f=b^c^d; else f=c^(b|(~d))
      const g = G[r](i)
      const tmp = d; d = c; c = b
      const x = (a + f + T[i] + M[g]) >>> 0
      b = (b + rotl32(x, S[r*4+(i%4)])) >>> 0
      a = tmp
    }
    a0 = (a0+a)>>>0; b0 = (b0+b)>>>0; c0 = (c0+c)>>>0; d0 = (d0+d)>>>0
  }
  return toLEHex(a0)+toLEHex(b0)+toLEHex(c0)+toLEHex(d0)
}

// --- MD4 (RFC 1320) ---
function md4Bytes(bytes) {
  const len = bytes.length, bits = len * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  bytes.push(bits & 0xff, (bits>>>8) & 0xff, (bits>>>16) & 0xff, (bits>>>24) & 0xff, 0, 0, 0, 0)

  let [a0,b0,c0,d0] = [0x67452301,0xefcdab89,0x98badcfe,0x10325476]
  for (let off = 0; off < bytes.length; off += 64) {
    const X = new Array(16)
    for (let j = 0; j < 16; j++) X[j] = bytes[off+j*4] | (bytes[off+j*4+1]<<8) | (bytes[off+j*4+2]<<16) | (bytes[off+j*4+3]<<24)
    let [a,b,c,d] = [a0,b0,c0,d0]
    // Round 1
    const r1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
    const s1 = [3,7,11,19]
    for (let i = 0; i < 16; i++) {
      const f = (b&c)|((~b)&d)
      const v = (a + f + X[r1[i]]) >>> 0
      a = d; d = c; c = b; b = rotl32(v, s1[i%4])
    }
    // Round 2
    const r2 = [0,4,8,12,1,5,9,13,2,6,10,14,3,7,11,15]
    const s2 = [3,5,9,13]
    for (let i = 0; i < 16; i++) {
      const f = (b&c)|(b&d)|(c&d)
      const v = (a + f + X[r2[i]] + 0x5a827999) >>> 0
      a = d; d = c; c = b; b = rotl32(v, s2[i%4])
    }
    // Round 3
    const r3 = [0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15]
    const s3 = [3,9,11,15]
    for (let i = 0; i < 16; i++) {
      const f = b^c^d
      const v = (a + f + X[r3[i]] + 0x6ed9eba1) >>> 0
      a = d; d = c; c = b; b = rotl32(v, s3[i%4])
    }
    a0=(a0+a)>>>0; b0=(b0+b)>>>0; c0=(c0+c)>>>0; d0=(d0+d)>>>0
  }
  return toLEHex(a0)+toLEHex(b0)+toLEHex(c0)+toLEHex(d0)
}

function md4(str) { return md4Bytes(utf8Encode(str)) }

function ntlm(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    bytes.push(c & 0xff, (c >> 8) & 0xff)
  }
  return md4Bytes([...bytes])
}

// --- MySQL 3.23 ---
function mysql323(str) {
  let nr = 1345345333, nr2 = 0x12345671, add = 7
  for (const c of str) {
    if (c === ' ' || c === '\t') continue
    const tmp = c.charCodeAt(0)
    nr ^= (((nr & 63) + add) * tmp + ((nr << 8) & 0xFFFFFFFF)) >>> 0
    nr2 = ((nr2 + ((nr2 << 8) ^ nr)) & 0xFFFFFFFF) >>> 0
    add = ((add + tmp) & 0xFFFFFFFF) >>> 0
  }
  return (nr & 0x7FFFFFFF).toString(16).padStart(8,'0') + (nr2 & 0x7FFFFFFF).toString(16).padStart(8,'0')
}

// --- SHA-224 (SHA-256 with different IV, truncated to 224 bits) ---
function sha224(str) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]
  let H = [0xc1059ed8,0x367cd507,0x3070dd17,0xf70e5939,0xffc00b31,0x68581511,0x64f98fa7,0xbefa4fa4]
  const bytes = utf8Encode(str)
  const bitLen = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  bytes.push(0, 0, 0, 0, (bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff)
  const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0
  for (let off = 0; off < bytes.length; off += 64) {
    const W = new Array(64)
    for (let i = 0; i < 16; i++) W[i] = ((bytes[off+i*4]<<24)|(bytes[off+i*4+1]<<16)|(bytes[off+i*4+2]<<8)|bytes[off+i*4+3])>>>0
    for (let i = 16; i < 64; i++) {
      const s0 = (rotr(W[i-15],7) ^ rotr(W[i-15],18) ^ (W[i-15]>>>3)) >>> 0
      const s1 = (rotr(W[i-2],17) ^ rotr(W[i-2],19) ^ (W[i-2]>>>10)) >>> 0
      W[i] = (W[i-16]+s0+W[i-7]+s1)>>>0
    }
    let [a,b,c,d,e,f,g,h] = H
    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0
      const ch = ((e&f)^((~e>>>0)&g))>>>0
      const t1 = (h+S1+ch+K[i]+W[i])>>>0
      const S0 = (rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0
      const maj = ((a&b)^(a&c)^(b&c))>>>0
      const t2 = (S0+maj)>>>0
      h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0
  }
  return H.slice(0, 7).map(v => v.toString(16).padStart(8,'0')).join('')
}

// --- Keccak / SHA-3 ---
function keccak(messageBytes, rateBytes, outputBytes) {
  // 64-bit helpers using [lo, hi] pairs
  const xor64 = (a, b) => [(a[0]^b[0])>>>0, (a[1]^b[1])>>>0]
  const and64 = (a, b) => [(a[0]&b[0])>>>0, (a[1]&b[1])>>>0]
  const not64 = (a) => [(~a[0])>>>0, (~a[1])>>>0]
  const rot64 = (a, n) => {
    if (n === 0) return a
    if (n < 32) return [((a[0]<<n)|(a[1]>>>(32-n)))>>>0, ((a[1]<<n)|(a[0]>>>(32-n)))>>>0]
    if (n === 32) return [a[1], a[0]]
    n -= 32
    return [((a[1]<<n)|(a[0]>>>(32-n)))>>>0, ((a[0]<<n)|(a[1]>>>(32-n)))>>>0]
  }
  const RC = [
    [0x00000001,0x00000000],[0x00008082,0x00000000],[0x0000808a,0x80000000],[0x80008000,0x80000000],
    [0x0000808b,0x00000000],[0x80000001,0x00000000],[0x80008081,0x80000000],[0x00008009,0x80000000],
    [0x0000008a,0x00000000],[0x00000088,0x00000000],[0x80008009,0x00000000],[0x8000000a,0x00000000],
    [0x8000808b,0x00000000],[0x0000008b,0x80000000],[0x00008089,0x80000000],[0x00008003,0x80000000],
    [0x00008002,0x80000000],[0x00000080,0x80000000],[0x0000800a,0x00000000],[0x8000000a,0x80000000],
    [0x80008081,0x80000000],[0x00008080,0x80000000],[0x80000001,0x00000000],[0x80008008,0x80000000],
  ]
  const ROT = [
    [0,1,62,28,27],[36,44,6,55,20],[3,10,43,25,39],[41,45,15,21,8],[18,2,61,56,14]
  ]
  const state = Array.from({length:25}, () => [0,0])
  // Padding (SHA-3: append 0x06, pad to rate, set last bit)
  const bytes = [...messageBytes]
  bytes.push(0x06)
  while (bytes.length % rateBytes !== 0) bytes.push(0)
  bytes[bytes.length - 1] |= 0x80
  // Absorb
  for (let off = 0; off < bytes.length; off += rateBytes) {
    for (let i = 0; i < rateBytes / 8; i++) {
      const lo = bytes[off+i*8]|(bytes[off+i*8+1]<<8)|(bytes[off+i*8+2]<<16)|(bytes[off+i*8+3]<<24)
      const hi = bytes[off+i*8+4]|(bytes[off+i*8+5]<<8)|(bytes[off+i*8+6]<<16)|(bytes[off+i*8+7]<<24)
      state[i] = xor64(state[i], [lo>>>0, hi>>>0])
    }
    // Keccak-f[1600]
    for (let round = 0; round < 24; round++) {
      // θ
      const C = Array.from({length:5}, (_,x) => {
        let v = state[x]; for (let y=1;y<5;y++) v=xor64(v,state[x+y*5]); return v
      })
      const D = Array.from({length:5}, (_,x) => xor64(C[(x+4)%5], rot64(C[(x+1)%5], 1)))
      for (let x=0;x<5;x++) for (let y=0;y<5;y++) state[x+y*5]=xor64(state[x+y*5], D[x])
      // ρ + π
      const B = new Array(25)
      for (let x=0;x<5;x++) for (let y=0;y<5;y++) B[y+((2*x+3*y)%5)*5] = rot64(state[x+y*5], ROT[y][x])
      // χ
      for (let x=0;x<5;x++) for (let y=0;y<5;y++)
        state[x+y*5] = xor64(B[x+y*5], and64(not64(B[((x+1)%5)+y*5]), B[((x+2)%5)+y*5]))
      // ι
      state[0] = xor64(state[0], RC[round])
    }
  }
  // Squeeze
  const out = []
  for (let i = 0; i < Math.ceil(outputBytes / 8); i++) {
    const [lo, hi] = state[i]
    out.push(lo&0xff,(lo>>>8)&0xff,(lo>>>16)&0xff,(lo>>>24)&0xff,hi&0xff,(hi>>>8)&0xff,(hi>>>16)&0xff,(hi>>>24)&0xff)
  }
  return out.slice(0, outputBytes).map(b => b.toString(16).padStart(2,'0')).join('')
}
function sha3_256(str) { return keccak(utf8Encode(str), 136, 32) }
function sha3_512(str) { return keccak(utf8Encode(str), 72, 64) }

// --- Helpers ---
function rotl32(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0 }
function toLEHex(v) {
  return ((v & 0xff).toString(16).padStart(2,'0') +
    ((v >>> 8) & 0xff).toString(16).padStart(2,'0') +
    ((v >>> 16) & 0xff).toString(16).padStart(2,'0') +
    ((v >>> 24) & 0xff).toString(16).padStart(2,'0'))
}
function utf8Encode(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c < 0x80) bytes.push(c)
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)) }
    else if (c >= 0xd800 && c <= 0xdbff) {
      const hi = c, lo = str.charCodeAt(++i)
      c = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00)
      bytes.push(0xf0|(c>>18), 0x80|((c>>12)&0x3f), 0x80|((c>>6)&0x3f), 0x80|(c&0x3f))
    } else { bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)) }
  }
  return bytes
}

// --- Main export ---
const ALGO_MAP = {
  'md5':     text => md5(text),
  'md4':     text => md4(text),
  'sha1':    text => sha('SHA-1', text),
  'sha224':  text => sha224(text),
  'sha256':  text => sha('SHA-256', text),
  'sha384':  text => sha('SHA-384', text),
  'sha512':  text => sha('SHA-512', text),
  'sha3-256': text => sha3_256(text),
  'sha3-512': text => sha3_512(text),
  'ntlm':    text => ntlm(text),
  'ripemd160': null,
  'whirlpool': null,
  'mysql323': text => mysql323(text),
}

export async function computeHash(text, algorithm) {
  const fn = ALGO_MAP[algorithm]
  if (!fn) return null
  const result = fn(text)
  return result instanceof Promise ? result : result
}

export function isClientSupported(algorithm) {
  return ALGO_MAP[algorithm] != null
}
