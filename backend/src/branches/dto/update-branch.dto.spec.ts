import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateBranchDto } from './update-branch.dto';

describe('UpdateBranchDto contacts', () => {
  it('accepts empty multipart fields to clear optional contacts', async () => {
    const dto = plainToInstance(UpdateBranchDto, {
      phoneNumber: '',
      mailAddress: '',
      facebook: '',
      line: '',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      phoneNumber: null,
      mailAddress: null,
      facebook: null,
      line: null,
    });
  });

  it('rejects invalid nonempty phone numbers and emails', async () => {
    const dto = plainToInstance(UpdateBranchDto, {
      phoneNumber: 'invalid',
      mailAddress: 'invalid',
    });
    expect((await validate(dto)).map((error) => error.property)).toEqual(
      expect.arrayContaining(['phoneNumber', 'mailAddress']),
    );
  });

  it('keeps valid contacts and omitted fields intact', async () => {
    const dto = plainToInstance(UpdateBranchDto, {
      phoneNumber: '0812345678',
      mailAddress: 'branch@example.com',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.phoneNumber).toBe('0812345678');
    expect(dto.mailAddress).toBe('branch@example.com');
    expect(dto.line).toBeUndefined();
  });
});
