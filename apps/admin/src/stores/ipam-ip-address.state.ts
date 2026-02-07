import { defineStore } from 'pinia';

import {
  IpAddressService,
  type IpAddress,
  type IpAddressStatus,
  type ListIpAddressesResponse,
  type GetIpAddressResponse,
  type CreateIpAddressResponse,
  type UpdateIpAddressResponse,
} from '#/generated/api/modules/ipam';
import type { Paging } from '#/utils/request';

export const useIpamIpAddressStore = defineStore('ipam-ip-address', () => {
  /**
   * List IP addresses
   */
  async function listIpAddresses(
    paging?: Paging,
    formValues?: {
      subnetId?: string;
      deviceId?: string;
      status?: IpAddressStatus;
      query?: string;
    } | null,
  ): Promise<ListIpAddressesResponse> {
    return await IpAddressService.list({
      subnetId: formValues?.subnetId,
      deviceId: formValues?.deviceId,
      status: formValues?.status,
      query: formValues?.query,
      page: paging?.page,
      pageSize: paging?.pageSize,
    });
  }

  /**
   * Get an IP address by ID
   */
  async function getIpAddress(id: string): Promise<GetIpAddressResponse> {
    return await IpAddressService.get(id);
  }

  /**
   * Create a new IP address
   */
  async function createIpAddress(
    tenantId: number,
    data: Partial<IpAddress>,
  ): Promise<CreateIpAddressResponse> {
    return await IpAddressService.create({
      tenantId,
      address: data.address!,
      subnetId: data.subnetId!,
      hostname: data.hostname,
      macAddress: data.macAddress,
      description: data.description,
      deviceId: data.deviceId,
      status: data.status,
    });
  }

  /**
   * Update an IP address
   */
  async function updateIpAddress(
    id: string,
    data: Partial<IpAddress>,
    updateMask: string[],
  ): Promise<UpdateIpAddressResponse> {
    return await IpAddressService.update(id, {
      id,
      data: data as IpAddress,
      updateMask: updateMask.join(','),
    });
  }

  /**
   * Delete an IP address
   */
  async function deleteIpAddress(id: string): Promise<void> {
    return await IpAddressService.delete(id);
  }

  /**
   * Allocate the next available IP address from a subnet
   */
  async function allocateNextAddress(
    tenantId: number,
    subnetId: string,
    data?: Partial<IpAddress>,
  ) {
    return await IpAddressService.allocateNext({
      tenantId,
      subnetId,
      hostname: data?.hostname,
      description: data?.description,
      deviceId: data?.deviceId,
    });
  }

  function $reset() {}

  return {
    $reset,
    listIpAddresses,
    getIpAddress,
    createIpAddress,
    updateIpAddress,
    deleteIpAddress,
    allocateNextAddress,
  };
});
