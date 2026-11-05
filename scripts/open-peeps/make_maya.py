"""Writes components/landing/Maya.tsx from Open Peeps (CC0) drawing data, read as text."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from peep import offsets, piece  # noqa: E402

root = Path(sys.argv[1])
out = Path(sys.argv[2])
INK = "#14201B"
colors = {"outlineColor": INK, "skinColor": "#F1C9A5", "topColor": "#F4F1EA", "cupColor": "#FFFFFF"}

effigy = (root / "Effigy.js").read_text()
vb = re.search(r"viewBox: '([^']*)'", effigy).group(1)
hair_off = offsets(effigy, "createHair").get("MediumBangs")
body = piece(root / "body" / "effigy" / "Coffee.js", colors)
faces = {"reading": piece(root / "face" / "Calm.js", colors), "happy": piece(root / "face" / "Smile.js", colors)}
hair = piece(root / "head" / "MediumBangs.js", colors)
acc_off = offsets(effigy, "createAccessory").get("GlassesTwo")
acc = piece(root / "accessory" / "GlassesTwo.js", colors)
if acc_off:
    acc = f'<g transform="{acc_off}">{acc}</g>'
if hair_off:
    hair = f'<g transform="{hair_off}">{hair}</g>'

ts = f'''/**
 * Maya, the customer who left $72 in Loop Audio's cart, drawn from Open Peeps by Pablo Stanley (CC0, openpeeps.com),
 * recoloured in our ink. GENERATED from the Open Peeps drawing data: don't hand-edit the paths.
 */
export type MayaMood = "reading" | "happy";

const VIEWBOX = {json.dumps(vb)};
const BODY = {json.dumps(body)};
const FACE = {json.dumps(faces)} as const;
const HAIR = {json.dumps(hair)};
const GLASSES = {json.dumps(acc)};

export function Maya({{ mood, className = "" }}: {{ mood: MayaMood; className?: string }}) {{
  return (
    <svg viewBox={{VIEWBOX}} overflow="visible" role="img" aria-label={{mood === "happy" ? "Maya, the customer, smiling, holding a coffee" : "Maya, the customer, holding a coffee"}} className={{`peep ${{className}}`}}>
      <g key={{mood}} className="peep-hop">
        <g transform="translate(147, 639)" dangerouslySetInnerHTML={{{{ __html: BODY }}}} />
        <g transform="translate(342, 190)" dangerouslySetInnerHTML={{{{ __html: HAIR }}}} />
        <g transform="translate(531, 366)" dangerouslySetInnerHTML={{{{ __html: FACE[mood] }}}} />
        <g transform="translate(419, 421)" dangerouslySetInnerHTML={{{{ __html: GLASSES }}}} />
      </g>
    </svg>
  );
}}
'''
out.write_text(ts)
print("wrote", out, len(ts), "bytes")
