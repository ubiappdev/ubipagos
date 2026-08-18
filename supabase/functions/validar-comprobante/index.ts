import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { pagoId } = await req.json();
    if (!pagoId) {
      return new Response(
        JSON.stringify({ error: "pagoId es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pago, error: fetchError } = await supabase
      .from("alumnos_pagos")
      .select("*")
      .eq("id", pagoId)
      .maybeSingle();

    if (fetchError || !pago) {
      return new Response(
        JSON.stringify({ error: "Pago no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pago.comprobante_url) {
      return new Response(
        JSON.stringify({ error: "El pago no tiene comprobante adjunto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Accept both legacy public URLs and new private storage paths
    const urlParts = pago.comprobante_url.split("/comprobantes/");
    const storagePath = urlParts.length > 1
      ? urlParts[1]
      : pago.comprobante_url.replace(/^\/+/, "");
    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: "Ruta de comprobante invalida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create signed URL so OCR.space can access the private bucket image
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("comprobantes")
      .createSignedUrl(storagePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "No se pudo generar URL firmada para el comprobante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUrl = signedUrlData.signedUrl;
    const apiKey = Deno.env.get("OCR_SPACE_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Servicio de reconocimiento no configurado" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OCR.space API — OCREngine=2 is better for large isolated text (amounts)
    const resOCR = await fetch(
      `https://api.ocr.space/parse/imageurl?apikey=${apiKey}&url=${encodeURIComponent(imageUrl)}&language=spa&scale=true&detectOrientation=true&OCREngine=2`
    );
    const ocr = await resOCR.json();

    if (ocr.OCRExitCode !== 1) {
      const ocrData = {
        validated_at: new Date().toISOString(),
        es_valido: false,
        error: "Error en lectura OCR",
        ocr_exit_code: ocr.OCRExitCode,
        canal_pago: pago.canal_pago,
      };
      await supabase.from("alumnos_pagos").update({ ocr_data: ocrData }).eq("id", pagoId);
      return new Response(
        JSON.stringify({ esValido: false, error: "Error en lectura OCR" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textoDetectado = ocr.ParsedResults?.[0]?.ParsedText || "";
    const textoLimpio = textoDetectado.toLowerCase();
    const lineas = textoDetectado.split("\n").map((l: string) => l.trim()).filter((l: string) => l !== "");
    const lineasL = lineas.map((l: string) => l.toLowerCase());

    // ── 1. DETECTAR BANCO ─────────────────────────────────────
    const detectarBanco = (t: string): string => {
      if (t.includes("yapeaste") || t.includes("yape")) return "YAPE";
      if (t.includes("yolo")) return "YOLO";
      if (t.includes("mercantil") || t.includes("santa cruz")) return "MERCANTIL";
      if (t.includes("yasta") || t.includes("yaesta")) return "YAESTA";
      if (t.includes("bnb") || t.includes("nacional de bolivia")) return "BNB";
      if (t.includes("bisa") || t.includes("bi4")) return "BISA";
      if (t.includes("union") || t.includes("unión")) return "UNION";
      if (t.includes("solidario") || t.includes("bancosol")) return "BANCOSOL";
      if (t.includes("ganadero")) return "GANADERO";
      return "DESCONOCIDO";
    };
    const bancoFinal = detectarBanco(textoLimpio);

    // ── 2. DATOS DINAMICOS ────────────────────────────────────
    let titularOrigen: string | null = null;
    let nombreBancoDetalle: string | null = null;
    let fechaComprobante: string | null = null;

    if (bancoFinal === "YAPE") {
      nombreBancoDetalle = "YAPE";
      const idxReal = lineasL.findIndex((l) => l.includes("realizado por"));
      if (idxReal !== -1) {
        const partes = lineas[idxReal].split(/\t+/);
        if (partes.length > 1 && partes[partes.length - 1].trim()) {
          titularOrigen = partes[partes.length - 1].trim();
          if (lineas[idxReal + 1] && !/nro|cuenta|destino|datos/i.test(lineas[idxReal + 1])) {
            titularOrigen += " " + lineas[idxReal + 1].trim();
          }
        } else {
          titularOrigen = lineas[idxReal + 1] || null;
        }
      }
      const idxFecha = lineas.findIndex((l) => /\d{1,2}\s+[a-z]{3,4}\.?\s+\d{4}/i.test(l));
      if (idxFecha !== -1) fechaComprobante = lineas[idxFecha];
    } else if (bancoFinal === "YOLO") {
      nombreBancoDetalle = "YOLO PAGO";
      const idxEnv = lineasL.findIndex((l) => l.includes("enviado por"));
      if (idxEnv !== -1) titularOrigen = lineas[idxEnv + 1];
      const idxComp = lineasL.findIndex((l) => l.includes("comprobante"));
      if (idxComp !== -1 && lineas[idxComp + 1]) {
        const mF = lineas[idxComp + 1].match(/.*?\s*(?:am|pm)/i);
        fechaComprobante = mF ? mF[0] : lineas[idxComp + 1];
      }
    } else if (bancoFinal === "MERCANTIL") {
      nombreBancoDetalle = "BANCO MERCANTIL SANTA CRUZ";
      const idxOri = lineasL.findIndex((l) => l.includes("cuenta de origen"));
      if (idxOri !== -1) titularOrigen = lineas[idxOri + 1]?.replace(/[\d-]/g, "").trim();
      fechaComprobante = lineas.find((l) => /fecha/i.test(l))?.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1] || null;
    } else if (bancoFinal === "YAESTA") {
      nombreBancoDetalle = "YAESTA";
      const idxNT = lineasL.findIndex((l) => l.includes("transacción"));
      if (idxNT > 0) fechaComprobante = lineas[idxNT - 1];
      const idxCO = lineasL.findIndex((l) => l.includes("cuenta origen"));
      if (idxCO !== -1) titularOrigen = lineas[idxCO + 1]?.split("|").pop()?.trim() || null;
    } else {
      const fM = textoDetectado.match(/(\d{2}\/\d{2}\/\d{4})/);
      fechaComprobante = fM ? fM[1].trim() : null;
      const idxC = lineasL.findIndex((l) => l.includes("cuenta de origen") || l.includes("cuenta origen"));
      if (idxC !== -1) titularOrigen = lineas[idxC + 1];
    }

    // ── 3. EXTRAER MONTO ──────────────────────────────────────
    const extraerMonto = (lns: string[]): number | null => {
      for (const linea of lns) {
        const m = linea.match(/bs\.?\s*(\d+(?:[.,]\d{1,2})?)/i);
        if (m) return parseFloat(m[1].replace(",", "."));
      }
      for (let i = 0; i < lns.length - 1; i++) {
        if (/bs\.?/i.test(lns[i]) && lns[i].replace(/bs\.?\s*/i, "").trim() === "") {
          const sig = lns[i + 1].match(/(\d+(?:[.,]\d{1,2})?)/);
          if (sig) return parseFloat(sig[1].replace(",", "."));
        }
      }
      const mFull = lns.join(" ").match(/bs\.?\s*(\d+(?:[.,]\d{1,2})?)/i);
      if (mFull) return parseFloat(mFull[1].replace(",", "."));
      return null;
    };

    const montoOCR = extraerMonto(lineas);
    const montoEsperado = Number(pago.monto_pagado);

    const detectarTipoComprobante = (metodo: string, texto: string): string => {
      if (metodo === "QR" || /\bqr\b|yape|tigo money|qr simple/i.test(texto)) return "QR";
      if (metodo === "TRANSFERENCIA" || /interbancaria|otros bancos|transferencia a otros bancos|bcp/i.test(texto)) return "INTERBANCARIO";
      if (metodo === "EFECTIVO" || /recibo|mensualidad|recibi del señor|recibi del senor/i.test(texto)) return "RECIBO";
      return "VOUCHER";
    };
    const tipoComprobante = detectarTipoComprobante(pago.canal_pago, textoLimpio);

    // ── 4. EXTRAER REFERENCIA ─────────────────────────────────
    const extraerRef = (raw: string, b: string, lns: string[], lnsL: string[]): string | null => {
      if (b === "YAPE") {
        const idx = lnsL.findIndex((l) => l.includes("nro. de transacci") || l.includes("nro de transacci"));
        if (idx !== -1) {
          const partes = lns[idx].split(/\t+/);
          if (partes.length > 1) {
            const val = partes[partes.length - 1].trim();
            if (/^\d+$/.test(val)) return val;
          }
          const sig = lns[idx + 1]?.trim();
          if (sig && /^\d+$/.test(sig)) return sig;
        }
        const m = raw.match(/nro\.?\s*de\s*transacci[oó]n[\t\s]+(\d{6,})/i);
        if (m) return m[1].trim();
        const m2 = raw.match(/transacci[oó]n[\s\S]{0,30}?(\d{6,})/i);
        if (m2) return m2[1].trim();
        return null;
      }
      if (b === "YOLO") return raw.match(/(?:n[aº°]|nro\.?)\s*(\d+)/i)?.[1].trim() || null;
      if (b === "MERCANTIL") return raw.match(/c[oó]digo\s*de\s*transacci[oó]n[\t\s]+(\d+)/i)?.[1].trim() || null;
      if (b === "UNION") {
        const i = lnsL.findIndex((l) => l.includes("transacción no") || l.includes("transaccion no"));
        if (i !== -1) return (lns[i].split(":").pop()?.trim() + (lns[i + 1] || "")).replace(/\s+/g, "") || null;
        return null;
      }
      if (b === "GANADERO") return raw.match(/nro\.\s*(\d+)/i)?.[1].trim() || null;
      if (b === "BANCOSOL") {
        const m1 = raw.match(/n[uú]mero\s*de\s*comprobante\s*[:\s]*\n\s*([\d]+(?:\s*\/\s*[\d]+){2,})/i);
        if (m1) return m1[1].replace(/\s*\/\s*/g, "/").trim();
        const m2 = raw.match(/([\d]{8}(?:\s*\/\s*[\d]+){3,})/);
        if (m2) return m2[1].replace(/\s*\/\s*/g, "/").trim();
        return null;
      }
      return raw.match(/(?:transacci[oó]n|referencia|comprobante|nro|n[°º]|bancarizaci[oó]n)\s*[:\t\s-]*([a-z0-9\/]{6,})/i)?.[1].replace(/\s+/g, "").trim() || null;
    };

    const nroRef = extraerRef(textoDetectado, bancoFinal, lineas, lineasL);

    // ── 5. VALIDAR ────────────────────────────────────────────
    let esValido = true;
    let errorMsg: string | null = null;

    if (montoOCR === null) {
      esValido = false;
      errorMsg = "No se pudo detectar el monto en el comprobante";
    } else if (Math.floor(montoOCR) !== Math.floor(montoEsperado)) {
      esValido = false;
      errorMsg = `Monto incorrecto: el comprobante es de Bs ${Math.floor(montoOCR)} pero se esperaba Bs ${Math.floor(montoEsperado)}`;
    }

    if (esValido && !nroRef) {
      esValido = false;
      errorMsg = "No se pudo extraer el numero de referencia del comprobante";
    }

    // Check for duplicates
    if (esValido && nroRef) {
      const { data: dup } = await supabase
        .from("alumnos_pagos")
        .select("id")
        .eq("numero_transaccion", nroRef)
        .neq("id", pagoId)
        .maybeSingle();

      if (dup) {
        esValido = false;
        errorMsg = `Este comprobante ya fue registrado anteriormente (Ref: ${nroRef})`;
      }
    }

    // ── 6. GUARDAR RESULTADO OCR ─────────────────────────────
    const ocrData = {
      validated_at: new Date().toISOString(),
      es_valido: esValido,
      banco: nombreBancoDetalle || bancoFinal,
      referencia: nroRef,
      titular: titularOrigen,
      fecha_comprobante: fechaComprobante,
      monto_detectado: montoOCR,
      monto_esperado: montoEsperado,
      texto_completo: textoDetectado,
      error: errorMsg,
      canal_pago: pago.canal_pago,
      tipo_comprobante: tipoComprobante,
    };

    const nuevoEstado = esValido ? "APROBADO" : "RECHAZADO";

    const { error: updateError } = await supabase
      .from("alumnos_pagos")
      .update({
        ocr_data: ocrData,
        estado_conciliacion: nuevoEstado,
        numero_transaccion: nroRef || pago.numero_transaccion,
      })
      .eq("id", pagoId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Error al actualizar el pago" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If approved and it's a mensualidad, mark it as PAGADO
    if (esValido && pago.mensualidad_id) {
      await supabase
        .from("alumnos_mensualidades")
        .update({ estado: "PAGADO" })
        .eq("id", pago.mensualidad_id);
    }

    // If approved and it's a mass payment, mark all related mensualidades as PAGADO
    if (esValido && Array.isArray(pago.mensualidad_ids) && pago.mensualidad_ids.length > 0) {
      await supabase
        .from("alumnos_mensualidades")
        .update({ estado: "PAGADO" })
        .in("id", pago.mensualidad_ids);
    }

    // Send buzon message to the student
    const mensajeTitulo = esValido ? "Pago aprobado" : "Pago rechazado";
    const mensajeCuerpo = esValido
      ? `Su pago de Bs ${montoEsperado} fue aprobado automaticamente por el sistema de verificacion OCR. Banco: ${nombreBancoDetalle || bancoFinal}. Referencia: ${nroRef}.`
      : `Su pago de Bs ${montoEsperado} fue rechazado. Motivo: ${errorMsg}. Por favor, verifique el comprobante y vuelva a intentarlo.`;

    await supabase.from("buzon_mensajes").insert({
      alumno_id: pago.alumno_id,
      titulo: mensajeTitulo,
      cuerpo: mensajeCuerpo,
      tipo: "PAGO",
      leido: false,
    });

    return new Response(
      JSON.stringify({
        esValido,
        banco: bancoFinal,
        referencia: nroRef,
        titular: titularOrigen,
        fecha: fechaComprobante,
        monto: montoEsperado,
        estado: nuevoEstado,
        error: errorMsg,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
