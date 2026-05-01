import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';

const mockCandidateSave = jest.fn<() => Promise<any>>();
const mockEducationSave = jest.fn<() => Promise<any>>();
const mockWorkExperienceSave = jest.fn<() => Promise<any>>();
const mockResumeSave = jest.fn<() => Promise<any>>();
const mockValidateCandidateData = validateCandidateData as jest.MockedFunction<typeof validateCandidateData>;

jest.mock('../application/validator', () => ({
  validateCandidateData: jest.fn(),
}));

jest.mock('../domain/models/Candidate', () => ({
  Candidate: jest.fn().mockImplementation(() => ({
    save: mockCandidateSave,
    education: [],
    workExperience: [],
    resumes: [],
  })),
}));

jest.mock('../domain/models/Education', () => ({
  Education: jest.fn().mockImplementation(() => ({
    save: mockEducationSave,
    candidateId: undefined,
  })),
}));

jest.mock('../domain/models/WorkExperience', () => ({
  WorkExperience: jest.fn().mockImplementation(() => ({
    save: mockWorkExperienceSave,
    candidateId: undefined,
  })),
}));

jest.mock('../domain/models/Resume', () => ({
  Resume: jest.fn().mockImplementation(() => ({
    save: mockResumeSave,
    candidateId: undefined,
  })),
}));

const { Candidate: MockedCandidate } = jest.requireMock('../domain/models/Candidate') as { Candidate: jest.Mock };
const { Education: MockedEducation } = jest.requireMock('../domain/models/Education') as { Education: jest.Mock };
const { WorkExperience: MockedWorkExperience } = jest.requireMock('../domain/models/WorkExperience') as {
  WorkExperience: jest.Mock;
};
const { Resume: MockedResume } = jest.requireMock('../domain/models/Resume') as { Resume: jest.Mock };
const { validateCandidateData: realValidateCandidateData } = jest.requireActual('../application/validator') as {
  validateCandidateData: (data: any) => void;
};

const buildValidCandidate = (overrides: any = {}) => ({
  firstName: 'Nora',
  lastName: 'Iglesias',
  email: 'nora.iglesias@example.com',
  ...overrides,
});

describe('addCandidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateCandidateData.mockReset();
    mockValidateCandidateData.mockImplementation(() => undefined);
    mockCandidateSave.mockReset();
    mockCandidateSave.mockResolvedValue({ id: 1 });
    mockEducationSave.mockReset();
    mockEducationSave.mockResolvedValue({ id: 101 });
    mockWorkExperienceSave.mockReset();
    mockWorkExperienceSave.mockResolvedValue({ id: 201 });
    mockResumeSave.mockReset();
    mockResumeSave.mockResolvedValue({ id: 301 });
  });

  it('valida el payload una sola vez con los datos recibidos', async () => {
    const payload = buildValidCandidate();

    await addCandidate(payload);

    expect(mockValidateCandidateData).toHaveBeenCalledTimes(1);
    expect(mockValidateCandidateData).toHaveBeenCalledWith(payload);
  });

  it('si la validación falla, no persiste candidato ni relaciones', async () => {
    const payload = buildValidCandidate({ email: 'invalido' });
    mockValidateCandidateData.mockImplementation(() => {
      throw new Error('Invalid email');
    });

    const result = addCandidate(payload);

    await expect(result).rejects.toThrow();
    expect(MockedCandidate).not.toHaveBeenCalled();
    expect(mockCandidateSave).not.toHaveBeenCalled();
    expect(MockedEducation).not.toHaveBeenCalled();
    expect(MockedWorkExperience).not.toHaveBeenCalled();
    expect(MockedResume).not.toHaveBeenCalled();
  });

  it('guarda el candidato principal y retorna la entidad persistida', async () => {
    const payload = buildValidCandidate({ phone: '612345678' });
    const savedCandidate = { id: 7, ...payload };
    mockCandidateSave.mockResolvedValue(savedCandidate);

    const result = await addCandidate(payload);

    expect(MockedCandidate).toHaveBeenCalledWith(payload);
    expect(mockCandidateSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual(savedCandidate);
  });

  it('sin relaciones opcionales, guarda solo candidato', async () => {
    await addCandidate(buildValidCandidate());

    expect(mockCandidateSave).toHaveBeenCalledTimes(1);
    expect(MockedEducation).not.toHaveBeenCalled();
    expect(MockedWorkExperience).not.toHaveBeenCalled();
    expect(MockedResume).not.toHaveBeenCalled();
  });

  it('traduce error P2002 a mensaje funcional de email duplicado', async () => {
    mockCandidateSave.mockRejectedValue({ code: 'P2002' });

    await expect(addCandidate(buildValidCandidate())).rejects.toThrow('The email already exists in the database');
  });

  it('propaga errores no mapeados del guardado principal', async () => {
    const unexpectedError = new Error('Database timeout');
    mockCandidateSave.mockRejectedValue(unexpectedError);

    await expect(addCandidate(buildValidCandidate())).rejects.toBe(unexpectedError);
  });

  describe('educations', () => {
    it('guarda una Education por cada elemento recibido', async () => {
      const educations = [
        { institution: 'UPM', title: 'Ingenieria', startDate: '2020-09-01' },
        { institution: 'UC3M', title: 'Master', startDate: '2023-09-01' },
      ];
      const payload = buildValidCandidate({ educations });

      await addCandidate(payload);

      expect(MockedEducation).toHaveBeenCalledTimes(2);
      expect(MockedEducation).toHaveBeenNthCalledWith(1, educations[0]);
      expect(MockedEducation).toHaveBeenNthCalledWith(2, educations[1]);
      expect(mockEducationSave).toHaveBeenCalledTimes(2);
    });

    it('no guarda Education cuando el array está vacío', async () => {
      await addCandidate(buildValidCandidate({ educations: [] }));

      expect(MockedEducation).not.toHaveBeenCalled();
      expect(mockEducationSave).not.toHaveBeenCalled();
    });

    it('propaga error si falla Education.save', async () => {
      mockEducationSave.mockRejectedValue(new Error('Education persistence error'));
      const payload = buildValidCandidate({
        educations: [{ institution: 'UPM', title: 'Ingenieria', startDate: '2020-09-01' }],
      });

      await expect(addCandidate(payload)).rejects.toThrow('Education persistence error');
      expect(mockCandidateSave).toHaveBeenCalledTimes(1);
      expect(mockEducationSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('workExperiences', () => {
    it('guarda un WorkExperience por cada elemento recibido', async () => {
      const workExperiences = [
        { company: 'A', position: 'Dev', startDate: '2021-01-01' },
        { company: 'B', position: 'Lead', startDate: '2023-01-01' },
      ];
      const payload = buildValidCandidate({ workExperiences });

      await addCandidate(payload);

      expect(MockedWorkExperience).toHaveBeenCalledTimes(2);
      expect(MockedWorkExperience).toHaveBeenNthCalledWith(1, workExperiences[0]);
      expect(MockedWorkExperience).toHaveBeenNthCalledWith(2, workExperiences[1]);
      expect(mockWorkExperienceSave).toHaveBeenCalledTimes(2);
    });

    it('no guarda WorkExperience cuando el array está vacío', async () => {
      await addCandidate(buildValidCandidate({ workExperiences: [] }));

      expect(MockedWorkExperience).not.toHaveBeenCalled();
      expect(mockWorkExperienceSave).not.toHaveBeenCalled();
    });

    it('propaga error si falla WorkExperience.save', async () => {
      mockWorkExperienceSave.mockRejectedValue(new Error('WorkExperience persistence error'));
      const payload = buildValidCandidate({
        workExperiences: [{ company: 'A', position: 'Dev', startDate: '2021-01-01' }],
      });

      await expect(addCandidate(payload)).rejects.toThrow('WorkExperience persistence error');
      expect(mockCandidateSave).toHaveBeenCalledTimes(1);
      expect(mockWorkExperienceSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('cv', () => {
    it('guarda Resume cuando cv existe y no está vacío', async () => {
      const cv = { filePath: '/tmp/cv.pdf', fileType: 'application/pdf' };
      const payload = buildValidCandidate({ cv });

      await addCandidate(payload);

      expect(MockedResume).toHaveBeenCalledTimes(1);
      expect(MockedResume).toHaveBeenCalledWith(cv);
      expect(mockResumeSave).toHaveBeenCalledTimes(1);
    });

    it('no guarda Resume cuando cv es objeto vacío', async () => {
      await addCandidate(buildValidCandidate({ cv: {} }));

      expect(MockedResume).not.toHaveBeenCalled();
      expect(mockResumeSave).not.toHaveBeenCalled();
    });

    it('no guarda Resume cuando cv no está presente', async () => {
      await addCandidate(buildValidCandidate());

      expect(MockedResume).not.toHaveBeenCalled();
      expect(mockResumeSave).not.toHaveBeenCalled();
    });

    it('propaga error si falla Resume.save', async () => {
      mockResumeSave.mockRejectedValue(new Error('Resume persistence error'));
      const payload = buildValidCandidate({ cv: { filePath: '/tmp/cv.pdf', fileType: 'application/pdf' } });

      await expect(addCandidate(payload)).rejects.toThrow('Resume persistence error');
      expect(mockCandidateSave).toHaveBeenCalledTimes(1);
      expect(mockResumeSave).toHaveBeenCalledTimes(1);
    });
  });
});

describe('validateCandidateData', () => {
  it('acepta payload mínimo válido de creación', () => {
    expect(() => realValidateCandidateData(buildValidCandidate())).not.toThrow();
  });

  it('si existe id, omite validaciones obligatorias de creación', () => {
    expect(() => realValidateCandidateData({ id: 99, email: 'email-invalido' })).not.toThrow();
  });

  it.each([
    ['email inválido', buildValidCandidate({ email: 'correo-invalido' }), 'Invalid email'],
    ['phone inválido', buildValidCandidate({ phone: '123' }), 'Invalid phone'],
    ['firstName inválido', buildValidCandidate({ firstName: 'A' }), 'Invalid name'],
    ['address demasiado larga', buildValidCandidate({ address: 'A'.repeat(101) }), 'Invalid address'],
    ['cv mal formado', buildValidCandidate({ cv: { filePath: '/tmp/cv.pdf' } }), 'Invalid CV data'],
  ])('rechaza %s', (_label, payload, message) => {
    expect(() => realValidateCandidateData(payload)).toThrow(message);
  });

  it.each([
    [
      'institution vacía',
      buildValidCandidate({
        educations: [{ institution: '', title: 'Ingenieria', startDate: '2020-09-01' }],
      }),
      'Invalid institution',
    ],
    [
      'title demasiado largo',
      buildValidCandidate({
        educations: [{ institution: 'UPM', title: 'T'.repeat(101), startDate: '2020-09-01' }],
      }),
      'Invalid title',
    ],
    [
      'startDate inválida',
      buildValidCandidate({
        educations: [{ institution: 'UPM', title: 'Ingenieria', startDate: '01-09-2020' }],
      }),
      'Invalid date',
    ],
    [
      'endDate inválida',
      buildValidCandidate({
        educations: [
          { institution: 'UPM', title: 'Ingenieria', startDate: '2020-09-01', endDate: '31-12-2024' },
        ],
      }),
      'Invalid end date',
    ],
  ])('rechaza education con %s', (_label, payload, message) => {
    expect(() => realValidateCandidateData(payload)).toThrow(message);
  });

  it.each([
    [
      'company vacía',
      buildValidCandidate({
        workExperiences: [{ company: '', position: 'Backend Developer', startDate: '2020-09-01' }],
      }),
      'Invalid company',
    ],
    [
      'position vacía',
      buildValidCandidate({
        workExperiences: [{ company: 'Empresa X', position: '', startDate: '2020-09-01' }],
      }),
      'Invalid position',
    ],
    [
      'description demasiado larga',
      buildValidCandidate({
        workExperiences: [
          {
            company: 'Empresa X',
            position: 'Backend Developer',
            description: 'D'.repeat(201),
            startDate: '2020-09-01',
          },
        ],
      }),
      'Invalid description',
    ],
    [
      'startDate inválida',
      buildValidCandidate({
        workExperiences: [{ company: 'Empresa X', position: 'Backend Developer', startDate: '2020/09/01' }],
      }),
      'Invalid date',
    ],
    [
      'endDate inválida',
      buildValidCandidate({
        workExperiences: [
          {
            company: 'Empresa X',
            position: 'Backend Developer',
            startDate: '2020-09-01',
            endDate: '31-12-2024',
          },
        ],
      }),
      'Invalid end date',
    ],
  ])('rechaza workExperience con %s', (_label, payload, message) => {
    expect(() => realValidateCandidateData(payload)).toThrow(message);
  });
});
