import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { fechaCl, pesos } from "../finanzas/dinero";
import { ESTADOS, nombreEstado, TIPOS } from "./docs";
import DocumentoFicha from "./DocumentoFicha";
import Emisor from "./Emisor";

const PESTANAS = [
  ["cotizacion", "Cotizaciones"],
  ["factura_exenta", "Facturas exentas"],
  ["boleta_honorarios", "Boletas de honorarios"],
  ["emisor", "Datos del emisor"],
];

export default function Facturacion() {
  const [pestana, setPestana] = useState("cotizacion");
  const [config, setConfig] = useState(null);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");

  const cargarConfig = useCallback(
    () =>
      Promise.all([api.configFacturacion(), api.productos()])
        .then(([c, p]) => {
          setConfig(c);
          setProductos(p.productos);
        })
        .catch((e) => setError(e.message)),
    []
  );

  useEffect(() => {
    cargarConfig();
  }, [cargarConfig]);

  if (error && !config) return <p className="adm-error">{error}</p>;
  if (!config) {
    return (
      <div className="adm-centro adm-centro--bajo">
        <span className="adm-spinner" aria-label="Cargando" />
      </div>
    );
  }

  const sinEmisor = !config.emisor.nombre || !config.emisor.rut;

  return (
    <div className="adm-seccion">
      <div className="adm-chips adm-fac__pestanas" role="tablist">
        {PESTANAS.map(([id, texto]) => (
          <button key={id} role="tab" aria-selected={pestana === id} className={pestana === id ? "activo" : ""} onClick={() => setPestana(id)}>
            {texto}
          </button>
        ))}
      </div>

      {sinEmisor && pestana !== "emisor" && (
        <div className="adm-fin__faltantes">
          <span>
            <strong>Completa tus datos de emisor</strong>
            <small>Tu nombre o razón social y RUT aparecerán en las cotizaciones y documentos.</small>
          </span>
          <button className="adm-boton" onClick={() => setPestana("emisor")}>
            Completar datos
          </button>
        </div>
      )}

      {pestana === "emisor" ? (
        <Emisor config={config} onGuardado={(c) => setConfig((x) => ({ ...x, ...c }))} />
      ) : (
        <ListaDocumentos key={pestana} tipo={pestana} config={config} productos={productos} />
      )}
    </div>
  );
}

function ListaDocumentos({ tipo, config, productos }) {
  const [estado, setEstado] = useState("");
  const [buscar, setBuscar] = useState("");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ficha, setFicha] = useState(null); // {id} | {nuevo:true}

  const cargar = useCallback(() => {
    setError("");
    api
      .documentos({ tipo, estado, buscar: buscar.trim(), pagina })
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [tipo, estado, buscar, pagina]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  const t = TIPOS[tipo];
  const conRetencion = tipo === "boleta_honorarios";

  return (
    <>
      <div className="adm-filtros">
        <input className="adm-buscar" type="search" placeholder="Buscar cliente, referencia, N° o folio…" value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} />
        <select className="adm-select adm-fin__filtro" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} aria-label="Estado">
          <option value="">Todos los estados</option>
          {ESTADOS[tipo].map(([v, txt]) => (
            <option key={v} value={v}>
              {txt}
            </option>
          ))}
        </select>
        <button className="adm-boton adm-clientes__nuevo" onClick={() => setFicha({ nuevo: true })}>
          + {t.nuevo}
        </button>
      </div>

      {tipo !== "cotizacion" && (
        <p className="adm-texto-suave adm-fin__ayuda">
          Registro interno: prepara aquí el documento, emítelo en el SII y luego anota su folio y adjunta el PDF. También puedes crearlo desde una cotización aceptada.
        </p>
      )}
      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}

      {!datos ? (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      ) : datos.conteo[tipo] === 0 ? (
        <button className="adm-videos__vacio" onClick={() => setFicha({ nuevo: true })}>
          <strong>Aún no hay {t.plural.toLowerCase()}</strong>
          <span>{tipo === "cotizacion" ? "Crea tu primera cotización: eliges el cliente, agregas servicios del catálogo y la descargas en PDF." : "Créala aquí o conviértela desde una cotización aceptada."}</span>
        </button>
      ) : (
        <section className="adm-tarjeta">
          {datos.documentos.length === 0 ? (
            <p className="adm-vacio">Nada coincide con la búsqueda.</p>
          ) : (
            <div className="adm-tabla-caja">
              <table className="adm-tabla adm-tabla--clic">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Referencia</th>
                    {tipo !== "cotizacion" && <th>Folio SII</th>}
                    <th className="adm-fin__derecha">{conRetencion ? "Bruto" : "Total"}</th>
                    {conRetencion && <th className="adm-fin__derecha">Líquido</th>}
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.documentos.map((d) => (
                    <tr key={d.id} onClick={() => setFicha({ id: d.id })} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setFicha({ id: d.id })}>
                      <td className="adm-nowrap">
                        <strong>{d.codigo}</strong>
                        {d.archivo && <span title="Tiene el PDF del SII"> 📎</span>}
                      </td>
                      <td className="adm-nowrap">{fechaCl(d.fecha)}</td>
                      <td>{d.cliente ?? <span className="adm-texto-suave">—</span>}</td>
                      <td className="adm-fac__corto">{d.referencia ?? <span className="adm-texto-suave">—</span>}</td>
                      {tipo !== "cotizacion" && <td>{d.folio ?? <span className="adm-texto-suave">—</span>}</td>}
                      <td className="adm-fin__derecha adm-nowrap">{pesos(d.total)}</td>
                      {conRetencion && <td className="adm-fin__derecha adm-nowrap">{pesos(d.liquido)}</td>}
                      <td>
                        <span className={`adm-fac__estado adm-fac__estado--${d.estado}`}>{nombreEstado(tipo, d.estado)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {datos.paginas > 1 && (
            <div className="adm-paginacion">
              <span className="adm-texto-suave">
                Página {datos.pagina} de {datos.paginas}
              </span>
              <div>
                <button className="adm-boton adm-boton--suave" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                  ← Anterior
                </button>
                <button className="adm-boton adm-boton--suave" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {ficha && (
        <DocumentoFicha
          key={ficha.id ?? "nuevo"}
          id={ficha.id}
          tipo={tipo}
          config={config}
          productos={productos}
          onGuardado={(d, mensaje) => {
            setAviso(mensaje);
            setFicha(d ? { id: d.id } : null);
            cargar();
          }}
          onAbrirOtro={(id, mensaje) => {
            if (mensaje) setAviso(mensaje);
            setFicha({ id });
            cargar();
          }}
          onCerrar={() => {
            setFicha(null);
            cargar();
          }}
        />
      )}
    </>
  );
}
