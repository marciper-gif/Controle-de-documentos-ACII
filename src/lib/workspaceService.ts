import { Employee, ATR, POP, IT } from '../types';

/**
 * Base64Url encoder helper for Gmail raw format
 */
const base64UrlEncode = (str: string): string => {
  // Use unescape + encodeURIComponent for UTF-8 compatibility
  const encoded = btoa(unescape(encodeURIComponent(str)));
  return encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Format a document (ATR, POP, or IT) into a beautifully structured plain text report for Google Docs
 */
const formatDocToReportText = (doc: any, type: 'atr' | 'pop' | 'it'): string => {
  let text = '';
  const lineDivider = '='.repeat(60) + '\n';
  const sectionDivider = '-'.repeat(40) + '\n';

  if (type === 'atr') {
    const atr = doc as ATR;
    text += lineDivider;
    text += `ANÁLISE DE CARGO (ATR): ${atr.title.toUpperCase()}\n`;
    text += `Código: ${atr.id}\n`;
    text += lineDivider;
    text += `Setor: ${atr.sector}\n`;
    text += `Líder Direto: ${atr.directLeader}\n`;
    if (atr.indirectLeader) {
      text += `Líder Indireto: ${atr.indirectLeader}\n`;
    }
    text += `Data de Emissão: ${atr.emissionDate}\n`;
    text += `Revisão: ${atr.revision} ${atr.revisionDate ? `(${atr.revisionDate})` : ''}\n\n`;

    text += `1. SUMÁRIO DO CARGO\n`;
    text += sectionDivider;
    text += `${atr.summary}\n\n`;

    text += `2. ATRIBUIÇÕES DETALHADAS\n`;
    text += sectionDivider;
    atr.detailedTasks.forEach((task, index) => {
      text += `[${String(index + 1).padStart(2, '0')}] ${task}\n`;
    });
    text += '\n';

    text += `3. REQUISITOS DO CARGO\n`;
    text += sectionDivider;
    text += `Formação/Educação:\n- ${atr.requirements.education}\n\n`;
    text += `Experiência:\n- ${atr.requirements.experience}\n\n`;
    
    text += `Competências Técnicas:\n`;
    atr.requirements.technicalCompetencies.forEach(comp => {
      text += `- ${comp}\n`;
    });
    text += '\n';

    text += `Habilidades:\n- ${atr.requirements.skills.join(', ')}\n\n`;
    text += `Atitudes:\n- ${atr.requirements.attitudes.join(', ')}\n\n`;

    if (atr.notes) {
      text += `4. OBSERVAÇÕES / NOTAS ADICIONAIS\n`;
      text += sectionDivider;
      text += `${atr.notes}\n\n`;
    }
  } else if (type === 'it') {
    const it = doc as IT;
    text += lineDivider;
    text += `INSTRUÇÃO DE TRABALHO (IT): ${it.title.toUpperCase()}\n`;
    text += `Código: ${it.id}\n`;
    text += lineDivider;
    text += `Setor: ${it.sector}\n`;
    text += `Responsável: ${it.responsible}\n`;
    text += `Data de Emissão: ${it.emissionDate}\n`;
    text += `Revisão: ${it.revision} ${it.revisionDate ? `(${it.revisionDate})` : ''}\n\n`;

    text += `1. OBJETIVO\n`;
    text += sectionDivider;
    text += `${it.objective}\n\n`;

    text += `2. PASSOS DA INSTRUÇÃO\n`;
    text += sectionDivider;
    it.steps.forEach((step, index) => {
      text += `Passo ${index + 1}: ${step}\n`;
    });
    text += '\n';
  } else {
    const pop = doc as POP;
    text += lineDivider;
    text += `PROCEDIMENTO OPERACIONAL PADRÃO (POP): ${pop.title.toUpperCase()}\n`;
    text += `Código: ${pop.id}\n`;
    text += lineDivider;
    text += `Processo: ${pop.process || 'N/A'}\n`;
    text += `Setor: ${pop.sector}\n`;
    text += `Páginas: ${pop.pages}\n`;
    text += `Data de Emissão: ${pop.emissionDate}\n`;
    text += `Revisão: ${pop.revision} ${pop.revisionDate ? `(${pop.revisionDate})` : ''}\n\n`;

    text += `1. OBJETIVO\n`;
    text += sectionDivider;
    text += `${pop.objective}\n\n`;

    text += `2. CAMPO DE APLICAÇÃO\n`;
    text += sectionDivider;
    text += `${pop.applicationField.join(', ')}\n\n`;

    text += `3. RESPONSABILIDADES\n`;
    text += sectionDivider;
    text += `Responsável Primário: ${pop.responsiblePrimary}\n`;
    if (pop.responsibleSupport && pop.responsibleSupport.length > 0) {
      text += `Apoio / Suporte: ${pop.responsibleSupport.join(', ')}\n`;
    }
    text += '\n';

    text += `4. ENTRADAS E SAÍDAS\n`;
    text += sectionDivider;
    text += `Entradas:\n`;
    pop.inputs.forEach(input => {
      text += `- ${input}\n`;
    });
    text += `Saídas:\n`;
    pop.outputs.forEach(output => {
      text += `- ${output}\n`;
    });
    text += '\n';

    text += `5. PASSOS E FLUXO DE TRABALHO\n`;
    text += sectionDivider;
    pop.steps.forEach((step, index) => {
      text += `[Etapa ${index + 1}] ${step.title}\n`;
      text += `Descrição: ${step.description}\n`;
      if (step.substeps && step.substeps.length > 0) {
        text += `Sub-etapas:\n`;
        step.substeps.forEach(sub => {
          text += `  * ${sub}\n`;
        });
      }
      text += '\n';
    });

    text += `6. INDICADORES DE DESEMPENHO\n`;
    text += sectionDivider;
    pop.performanceIndicators.forEach(ind => {
      text += `- ${ind}\n`;
    });
    text += '\n';
  }

  // Revision History
  if (doc.revisionHistory && doc.revisionHistory.length > 0) {
    text += `HISTÓRICO DE REVISÕES\n`;
    text += lineDivider;
    doc.revisionHistory.forEach((rev: any) => {
      text += `Rev ${rev.revision} | Data: ${rev.date} | Descrição: ${rev.description} | Autor: ${rev.author}\n`;
    });
    text += '\n';
  }

  text += `Documento exportado do Portal em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
  return text;
};

/**
 * 1. GOOGLE DOCS: Export document to Google Docs
 */
export const exportToGoogleDoc = async (
  accessToken: string,
  docData: any,
  type: 'atr' | 'pop' | 'it'
): Promise<{ documentId: string; documentUrl: string }> => {
  const title = `${docData.id} - ${docData.title}`;

  // Step A: Create an empty Google Doc
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erro ao criar Google Doc: ${errText}`);
  }

  const document = await createRes.json();
  const documentId = document.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // Step B: Build formatted report text and insert it
  const reportText = formatDocToReportText(docData, type);

  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: reportText,
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Erro ao preencher o Google Doc: ${errText}`);
  }

  return { documentId, documentUrl };
};

/**
 * 2. GOOGLE SHEETS: Export Employees and Documents to a dynamic multi-tab Google Sheet
 */
export const exportDataToGoogleSheet = async (
  accessToken: string,
  employees: Employee[],
  atrs: ATR[],
  pops: POP[],
  its: IT[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const sheetTitle = `Normatiza - Painel Geral (${new Date().toLocaleDateString('pt-BR')})`;

  // Create spreadsheet with two sheets: "Funcionários" and "Documentos"
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: 'Funcionários',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Documentos do Portal',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Erro ao criar Google Sheet: ${errText}`);
  }

  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;
  const spreadsheetUrl = sheet.spreadsheetUrl;

  // Prepare employee rows
  const employeeHeaders = [
    'Matrícula/Reg.',
    'Nome Completo',
    'E-mail',
    'Telefone',
    'Setor',
    'Cargo/Função',
    'Data de Admissão',
    'Status',
    'CPF',
    'POP Associados',
    'ATR Associadas',
    'IT Associadas',
    'Observações',
  ];

  const employeeRows = employees.map(emp => [
    emp.registrationNumber || '-',
    emp.name,
    emp.email,
    emp.phone,
    emp.sector,
    emp.role,
    emp.admissionDate,
    emp.status,
    emp.cpf || '-',
    emp.associatedPOPs?.join(', ') || 'Nenhum',
    emp.associatedATRs?.join(', ') || 'Nenhuma',
    emp.associatedITs?.join(', ') || 'Nenhuma',
    emp.notes || '',
  ]);

  // Prepare document rows
  const docHeaders = [
    'Código/ID',
    'Tipo',
    'Título do Documento',
    'Setor Responsável',
    'Data de Emissão',
    'Revisão',
    'Responsável Primário',
    'Apoio/Suporte/Líder',
    'Objetivo / Resumo',
  ];

  const docRows: any[][] = [];

  pops.forEach(pop => {
    docRows.push([
      pop.id,
      'POP',
      pop.title,
      pop.sector,
      pop.emissionDate,
      pop.revision,
      pop.responsiblePrimary,
      pop.responsibleSupport?.join(', ') || '-',
      pop.objective,
    ]);
  });

  atrs.forEach(atr => {
    docRows.push([
      atr.id,
      'ATR',
      atr.title,
      atr.sector,
      atr.emissionDate,
      atr.revision,
      atr.directLeader,
      atr.indirectLeader || '-',
      atr.summary,
    ]);
  });

  its.forEach(it => {
    docRows.push([
      it.id,
      'IT',
      it.title,
      it.sector,
      it.emissionDate,
      it.revision,
      it.responsible,
      '-',
      it.objective,
    ]);
  });

  // Populate "Funcionários" sheet
  const populateEmployeesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Funcionários!A1:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [employeeHeaders, ...employeeRows],
      }),
    }
  );

  if (!populateEmployeesRes.ok) {
    console.warn('Erro ao preencher dados de funcionários:', await populateEmployeesRes.text());
  }

  // Populate "Documentos do Portal" sheet
  const populateDocsRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Documentos do Portal'!A1:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [docHeaders, ...docRows],
      }),
    }
  );

  if (!populateDocsRes.ok) {
    console.warn('Erro ao preencher dados de documentos:', await populateDocsRes.text());
  }

  return { spreadsheetId, spreadsheetUrl };
};

/**
 * 3. GMAIL: Send formatted document link or custom message to employee via Gmail API
 */
export const sendEmailWithGmail = async (
  accessToken: string,
  to: string,
  subject: string,
  bodyHtml: string
): Promise<void> => {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyHtml,
  ];

  const emailContent = emailLines.join('\r\n');
  const rawBase64 = base64UrlEncode(emailContent);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawBase64,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro ao enviar e-mail via Gmail: ${errText}`);
  }
};
