# Open Peeps cartoons (landing page)

`components/landing/Owner.tsx` and `components/landing/Maya.tsx` are generated from
[Open Peeps](https://www.openpeeps.com/) by Pablo Stanley (CC0), via the `@opeepsfun/open-peeps` npm package's drawing
files. The scripts read those files **as text** (they never run the package's code) and write our components, in our
ink colour.

```sh
mkdir -p /tmp/peeps && cd /tmp/peeps && npm pack @opeepsfun/open-peeps@1.0.6 && tar xzf opeepsfun-open-peeps-1.0.6.tgz && chmod -R u+rwX package
cd -   # back to the repo
python3 -I scripts/open-peeps/make_owner.py /tmp/peeps/package/build components/landing/Owner.tsx
python3 -I scripts/open-peeps/make_maya.py /tmp/peeps/package/build components/landing/Maya.tsx
```

Pick other pieces (body, hair, faces, colours) at the top of each script. Don't hand-edit the generated paths.
