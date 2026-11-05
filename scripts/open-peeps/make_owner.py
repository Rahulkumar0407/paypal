"""Writes components/landing/Owner.tsx from Open Peeps (CC0) drawing data, read as text."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from peep import offsets, piece  # noqa: E402

root = Path(sys.argv[1])
out = Path(sys.argv[2])
INK = "#14201B"
colors = {"outlineColor": INK, "skinColor": "#B7774F", "topColor": "#F4F1EA", "paperColor": "#FFFFFF"}

effigy = (root / "Effigy.js").read_text()
vb = re.search(r"viewBox: '([^']*)'", effigy).group(1)
hair_off = offsets(effigy, "createHair").get("Bun")

bodies = {"paper": "Paper", "arms": "TeeArmsCrossed"}
faces = {"calm": "Calm", "worried": "Concerned", "happy": "BigSmile", "alarmed": "Fear"}

body_svg = {k: piece(root / "body" / "effigy" / f"{v}.js", colors) for k, v in bodies.items()}
face_svg = {k: piece(root / "face" / f"{v}.js", colors) for k, v in faces.items()}
hair = piece(root / "head" / "Bun.js", colors)
if hair_off:
    hair = f'<g transform="{hair_off}">{hair}</g>'

ts = f'''/**
 * Loop Audio's owner, drawn from Open Peeps by Pablo Stanley (CC0, openpeeps.com), recoloured in our ink.
 * GENERATED from the Open Peeps drawing data: don't hand-edit the paths.
 *
 * The owner shows how the shop's money looks: calm, worried (a short day ahead, holding the bill), happy (covered,
 * arms crossed) or alarmed (the safety check blocked a move). Changing mood swaps the face and pose with a small hop.
 */
export type OwnerMood = "calm" | "worried" | "happy" | "alarmed";

const VIEWBOX = {json.dumps(vb)};
const BODY = {json.dumps(body_svg)} as const;
const FACE = {json.dumps(face_svg)} as const;
const HAIR = {json.dumps(hair)};

const LABEL: Record<OwnerMood, string> = {{
  calm: "The shop's owner, calm",
  worried: "The shop's owner, worried, holding a bill",
  happy: "The shop's owner, smiling with arms crossed",
  alarmed: "The shop's owner, alarmed",
}};

export function Owner({{ mood, className = "" }}: {{ mood: OwnerMood; className?: string }}) {{
  const pose = mood === "happy" ? "arms" : "paper";
  return (
    <svg viewBox={{VIEWBOX}} overflow="visible" role="img" aria-label={{LABEL[mood]}} className={{`peep ${{className}}`}}>
      <g key={{mood}} className="peep-hop">
        <g transform="translate(147, 639)" dangerouslySetInnerHTML={{{{ __html: BODY[pose] }}}} />
        <g transform="translate(342, 190)" dangerouslySetInnerHTML={{{{ __html: HAIR }}}} />
        <g transform="translate(531, 366)" dangerouslySetInnerHTML={{{{ __html: FACE[mood] }}}} />
      </g>
    </svg>
  );
}}
'''
out.write_text(ts)
print("wrote", out, len(ts), "bytes")
