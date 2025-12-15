# Model Reference (Equations)

This model is a lumped, variable-driven approximation intended for **relative comparisons**.

## Unit conversion
\(
1~\mathrm{BTU/hr} = 0.29307107~\mathrm{W}
\)

\(
P_{burner} = \mathrm{BTU/hr}\times 0.29307107
\)

## Plume power and capture
\(
P_{plume} = P_{burner} \, f_{conv}
\)

\(
P_{cap} = P_{plume}\, f_{capture}\, (1 - f_{wind\_loss})
\)

\(
P_{cap,eff} = P_{cap}\, (1 - f_{bypass})
\)

## Heat transfer effectiveness (UA/C)
\(
\varepsilon = 1 - e^{-UA/C}
\)

\(
P_{wall} = P_{cap,eff}\,\varepsilon
\)

## IR outward power
\(
P_{IR} = P_{wall}\,\eta_{rad}
\)

\(
P_{IR,out} = P_{IR}\,\eta_{out}
\)

## Irradiance (hemisphere)
\(
E(d) \approx \frac{P_{IR,out}}{2\pi d^2}
\)

We approximate \(d = (s + R_{avg})\) where:
- \(s\) = distance from emitter surface to occupant
- \(R_{avg}\) = average emitter radius (from inlet/outlet)

## Absorbed by occupant
\(
P_{abs} = E(d)\,A\,\alpha
\)
