"""Builds Open Peeps (CC0) bust SVGs by reading the package's drawing files as TEXT (never executing them).

Usage as a module: build(root, body, head, face, beard=None, acc=None, colors={}) -> (inner_svg, viewbox)
"""
import re
from pathlib import Path

EL = re.compile(r'createElement\("(path|rect)", \{([^}]*)\}\)')
PROP = re.compile(r"(\w+): ('([^']*)'|\"([^\"]*)\"|[\w.]+)")
DEFAULT = re.compile(r"_a\.(\w+), \w+ = \w+ === void 0 \? \"([^\"]*)\"")


def kebab(name: str) -> str:
    return re.sub(r"([A-Z])", lambda m: "-" + m.group(1).lower(), name)


def piece(path: Path, colors: dict) -> str:
    src = path.read_text()
    defaults = dict(DEFAULT.findall(src))
    out = []
    for tag, props in EL.findall(src):
        attrs = []
        for key, raw, single, double in PROP.findall(props):
            if raw.startswith(("'", '"')):
                value = single or double
            else:  # a colour variable such as skinColor
                value = colors.get(raw, defaults.get(raw, "#000"))
            attrs.append(f'{kebab(key)}="{value}"')
        out.append(f"<{tag} {' '.join(attrs)}/>")
    return "".join(out)


def offsets(effigy: str, fn: str) -> dict:
    body = effigy.split(f"var {fn} = function", 1)[1].split("\n};", 1)[0]
    return {name: t for name, t in re.findall(r'type === "(\w+)"\) \{\s*return React\.createElement\("g", \{ transform: \'([^\']*)\'', body)}


def build(root: Path, body: str, head: str, face: str, beard=None, acc=None, colors=None):
    colors = colors or {}
    effigy = (root / "Effigy.js").read_text()
    vb = re.search(r"viewBox: '([^']*)'", effigy).group(1)
    hair_off = offsets(effigy, "createHair").get(head)
    beard_off = offsets(effigy, "createBeard").get(beard or "")
    acc_off = offsets(effigy, "createAccessory").get(acc or "")
    head_off = offsets(effigy, "createHead").get(body)

    def wrap(content: str, t):
        return f'<g transform="{t}">{content}</g>' if t else content

    hair = wrap(piece(root / "head" / f"{head}.js", colors), hair_off)
    face_svg = piece(root / "face" / f"{face}.js", colors)
    beard_svg = wrap(piece(root / "beard" / f"{beard}.js", colors), beard_off) if beard else ""
    acc_svg = wrap(piece(root / "accessory" / f"{acc}.js", colors), acc_off) if acc else ""
    head_group = (
        f'<g transform="translate(342, 190)">{hair}</g>'
        f'<g class="peep-face" transform="translate(531, 366)">{face_svg}</g>'
        f'<g transform="translate(495, 518)">{beard_svg}</g>'
        f'<g transform="translate(419, 421)">{acc_svg}</g>'
    )
    inner = (
        f'<g transform="translate(147, 639)">{piece(root / "body" / "effigy" / f"{body}.js", colors)}</g>'
        + wrap(head_group, head_off)
    )
    return inner, vb


def face_only(root: Path, face: str, colors=None) -> str:
    return piece(root / "face" / f"{face}.js", colors or {})
